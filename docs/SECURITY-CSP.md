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

## `style-src` conserva `'unsafe-inline'`

MUI / emotion **inyectan estilos inline en runtime**. Quitar `'unsafe-inline'` de `style-src`
rompería los estilos. El riesgo de XSS por estilos es mucho menor que por scripts, así que se
mantiene (solo `script-src` se endureció).

## El CSP resultante

```
default-src 'self';
script-src 'self' 'nonce-<único>' 'strict-dynamic'   (+ 'unsafe-eval' solo en dev);
style-src 'self' 'unsafe-inline';
font-src 'self';                 (fuentes servidas desde el repo, src/app/fonts/)
img-src 'self' data: blob: https://*.supabase.co https://lh3.googleusercontent.com https://avatars.githubusercontent.com;
connect-src 'self' https://*.supabase.co wss://*.supabase.co;
frame-ancestors 'self'; object-src 'none'; base-uri 'self'; form-action 'self'
```

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

## Próximas mejoras posibles

- **Reportar violaciones** con `report-to` / `Reporting-Endpoints`, para detectar en producción
  cualquier script que quede bloqueado sin romper la UX.
- **Quitar `'unsafe-inline'` de `style-src`:** emotion acepta un `nonce` en su cache
  (`createCache({ key: "css", nonce })`). Pasar el mismo nonce del proxy (header `x-nonce`) al
  `CacheProvider` de MUI permitiría usar `style-src 'self' 'nonce-…'`. Hay que verificar que
  MUI X siga funcionando y reemplazar los ~25 atributos `style={{…}}` inline (en `Charts.jsx`, `BudgetTab`, `shared.jsx`, las páginas de auth, etc.), que un `style-src` sin `'unsafe-inline'` bloquea.
