# Content-Security-Policy con nonce por request

> Endurecimiento de seguridad: elimina `'unsafe-inline'` de `script-src`
> — la mejora de seguridad de mayor severidad que quedaba pendiente.

## Qué cambió y por qué

Antes, el CSP vivía estático en `next.config.mjs` con `script-src 'self' 'unsafe-inline'`.
`'unsafe-inline'` permite ejecutar **cualquier** `<script>` inline, lo que neutraliza la
protección del CSP frente a XSS inyectado. La solución estándar es un **nonce único por
request**: solo los scripts que llevan ese nonce (los que genera Next) pueden ejecutarse.

Como el nonce debe ser distinto en cada respuesta, **no puede vivir en headers estáticos** →
se movió al middleware (`src/proxy.ts`), que corre en cada request.

## Cómo funciona (flujo)

```
request
  │
  ▼
src/proxy.ts (middleware)
  ├─ nonce = base64(crypto.randomUUID())
  ├─ csp   = "script-src 'self' 'nonce-<nonce>' 'strict-dynamic' …"
  ├─ forwardHeaders():  request headers + x-nonce + Content-Security-Policy
  │     └─ NextResponse.next({ request: { headers } })   ← Next lee el nonce de aquí
  ▼
render (dinámico)  ── Next estampa el nonce en TODOS sus <script>
  ▼
response  ── header Content-Security-Policy: …'nonce-<nonce>'…
```

1. **`proxy.ts`** genera el nonce y arma el CSP (`buildCsp(nonce)`).
2. Reenvía `x-nonce` + `Content-Security-Policy` en los **headers del request** vía
   `NextResponse.next({ request: { headers } })`. Next.js **lee el nonce de ese header del
   request** y lo estampa en sus `<script>` (inline y externos).
3. El mismo CSP se setea en el **header de la respuesta** (y en los redirects del guard).

### El punto frágil: cookies de refresh-token

El callback `setAll` de Supabase **recrea la respuesta** cada vez que refresca cookies. Por eso
`forwardHeaders()` se **reconstruye desde `request.headers` después de cada mutación de
cookies** — así no se pierde ni el reenvío del refresh-token ni el header CSP. Si esto se
rompe, el síntoma sería un **logout silencioso** cuando expira el access token (~1h).

### `strict-dynamic` y el requisito de render dinámico

`'strict-dynamic'` hace que el navegador **ignore `'self'`** para scripts y confíe solo en los
scripts con nonce (y los que estos carguen). Esto propaga la confianza a los chunks de Next sin
listar hosts, pero implica que **cualquier script sin nonce queda bloqueado**.

Las páginas **prerenderizadas estáticamente** (`○`) generan su HTML en build-time, cuando el
nonce-por-request todavía no existe → servirían scripts **sin nonce** que `strict-dynamic`
bloquea → la app **no hidrata**. Por eso el layout raíz fuerza render dinámico:

```tsx
// src/app/layout.tsx
export default async function RootLayout({ children }) {
  await headers()   // opta por render dinámico → Next puede estampar el nonce
  …
}
```

Tras este cambio, todas las rutas pasaron de `○` (estático) a `ƒ` (dinámico).
Coste: se pierde el prerender estático de las páginas de auth — irrelevante aquí (formularios
pequeños, app ya auth-gated).

## Estilos: `<style>` con nonce, atributos `style` inline

Los estilos tienen dos formas, y el CSP las trata por separado:

- **Elementos `<style>` (`style-src-elem 'self' 'nonce-…'`):** los escribe emotion (MUI). El
  layout lee `x-nonce` y lo pasa a `AppRouterCacheProvider options={{ key: "mui", nonce }}`.
  Emotion lo pone en cada `<style>` que genera, tanto en el HTML del servidor como en los que
  agrega el navegador después. Un `<style>` inyectado sin el nonce queda bloqueado.
- **Atributos `style="…"` (`style-src-attr 'unsafe-inline'`):** MUI los escribe en el HTML del
  servidor (transiciones, posiciones), y quedan unos 25 `style={{…}}` en los componentes. Un
  atributo `style` no puede cargar recursos ni ejecutar código; lo peligroso de inyectar estilos
  (leer datos con selectores y `url()`, tapar la pantalla) necesita un `<style>`.
- **`style-src 'self' 'unsafe-inline'`** queda como respaldo para navegadores sin las directivas
  `-elem`/`-attr` (Safari < 15.4, Firefox < 108). Los demás lo ignoran para `<style>`.
- **En desarrollo** `style-src-elem` lleva `'unsafe-inline'` sin nonce: la recarga en caliente de
  Next inserta `<style>` propios.

## Reporte de violaciones

`report-uri /api/csp-report`: el navegador envía cada violación a esa ruta, que la escribe como
una línea JSON `[csp-report]` en los logs del servidor (Vercel → Logs), igual que
`/api/client-error`. La ruta no pide sesión (las páginas de auth también reportan), acepta hasta
8 KB y hasta 10 reportes por envío, conserva solo los campos conocidos y quita la query y el hash
de las URLs (un enlace de recuperación de contraseña lleva un token).

No se usa `report-to` (Reporting API): cuando están los dos, Chromium usa solo `report-to`, y
en las pruebas con Chromium (con y sin interfaz, más de 100 s de espera) nunca entregó esos
reportes. Con `report-uri` los envía al instante Chromium, Firefox y Safari. La ruta también
acepta el formato de la Reporting API, por si se agrega más adelante.

## El CSP resultante

```
default-src 'self';
script-src 'self' 'nonce-<único>' 'strict-dynamic'   (+ 'unsafe-eval' solo en dev);
style-src 'self' 'unsafe-inline';                 (respaldo para navegadores viejos)
style-src-elem 'self' 'nonce-<único>';           ('unsafe-inline' en dev)
style-src-attr 'unsafe-inline';
font-src 'self';                 (fuentes servidas desde el repo, src/app/fonts/)
img-src 'self' data: blob: https://*.supabase.co https://lh3.googleusercontent.com https://avatars.githubusercontent.com;
connect-src 'self' <NEXT_PUBLIC_SUPABASE_URL> https://*.supabase.co wss://*.supabase.co;
frame-ancestors 'self'; object-src 'none'; base-uri 'self'; form-action 'self';
report-uri /api/csp-report
```

`<NEXT_PUBLIC_SUPABASE_URL>` es el origen del proyecto configurado. En producción ya lo cubre `*.supabase.co`; se agrega para un dominio propio y para el Supabase simulado de los tests end-to-end (`http://127.0.0.1:54321`).

Las tasas de cambio del día no agregan ningún origen: el navegador las pide a `/api/rates` (`'self'`), y es el servidor el que consulta a open.er-api.com.

## Cómo verificar

### Por HTTP (lo que ya se hizo en local, `npm run build && npm start`)

```bash
curl -s -D /tmp/h.txt http://localhost:3000/login -o /tmp/login.html
# 1) el header trae nonce + strict-dynamic, sin 'unsafe-inline' en script-src
grep -i content-security-policy /tmp/h.txt
# 2) NO está prerenderizada (vacío = dinámico)
grep -i x-nextjs-prerender /tmp/h.txt
# 3) ningún <script> sin nonce (debe ser 0)
grep -o '<script[^>]*>' /tmp/login.html | grep -v 'nonce=' | wc -l
```

Resultado esperado y verificado: páginas dinámicas, **todos** los scripts con el nonce que
coincide con el header, **0 scripts sin proteger**, y los redirects del guard llevan el CSP.

### En navegador

1. **Consola sin violaciones:** verificado con Playwright sobre `next start` (versión `0.0.1`).
   `/login` responde con el CSP con nonce, hidrata y no registra violaciones de CSP ni errores
   de hidratación, en tema claro y oscuro. El dashboard requiere sesión de Supabase: revisar la
   consola en el preview de Vercel.
2. **Refresh de token (~1h), pendiente de verificar a mano:** loguearse, dejar la pestaña
   abierta y volver tras la expiración del access token → debe **renovar sesión**, no expulsar
   al login. Es el único punto que no se puede probar sin una sesión real.

## Cómo lo prueban los tests

- **`/login`, en tema claro y oscuro:** el CSP trae `style-src-elem` con el mismo nonce que
  `script-src`, y todos los `<style>` de la página lo llevan.
- **Un `<style>` inyectado sin nonce** dispara `securitypolicyviolation` con
  `style-src-elem`, no se aplica, y el navegador envía el reporte a `/api/csp-report` (204).
- **Todos los tests con sesión** fallan si la consola registra una violación del CSP. Se
  comprobó quitando el nonce del layout: fallan 13 de 13.
- **Tests unitarios de la ruta:** los dos formatos, sin query ni hash, campos desconocidos
  descartados, 400 y 413.

## Próximas mejoras posibles

- **Quitar `'unsafe-inline'` de `style-src-attr`:** habría que reemplazar los ~25 `style={{…}}`
  por `sx` y confirmar que MUI no escribe atributos `style` en el HTML del servidor, algo que
  hoy hace en las transiciones.
