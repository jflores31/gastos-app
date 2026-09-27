# Seguridad

🌐 **Español** · [English](SECURITY.en.md)

Medidas de seguridad de la app. El detalle del Content-Security-Policy está en [SECURITY-CSP.md](SECURITY-CSP.md).

| Medida | Detalle |
|---|---|
| HTTP Security Headers | CSP **con nonce por request** (`script-src 'self' 'nonce-…' 'strict-dynamic'`, sin `'unsafe-inline'`; los `<style>` de emotion también llevan el nonce) generada en `proxy.ts`, con las violaciones reportadas a `/api/csp-report`; resto de headers (X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy) en `next.config.mjs` |
| Verificación en dos pasos | TOTP con el MFA de Supabase (Perfil). Con ella activa, al entrar se pide el código; `proxy.ts` deja una sesión `aal1` solo en `/login?mfa=1`, `DataContext` no carga hasta el código y la base (políticas `RESTRICTIVE` de [`supabase/schema.sql`](DATABASE.md#en-el-sql-parte-2)) no devuelve ni acepta filas sin `aal2`, así tampoco se salta usando la API de Supabase directamente |
| RLS en Supabase | Todas las tablas con políticas owner-only `FOR ALL TO authenticated USING / WITH CHECK (auth.uid() = user_id)` |
| Política de contraseñas | `minimum_password_length = 8` en `supabase/config.toml` |
| Guardas en DELETE/UPDATE | Cada mutación captura `{ error }` y hace `throw error` si falla — el estado local nunca se muta ante error |
| Sesión por browser session | `gastos_session_alive` en `sessionStorage` (limpiado por el navegador al cerrar); reabrir el browser fuerza re-login. La sesión sobrevive recargas de página normales. Una pestaña nueva abierta a mano pregunta por `BroadcastChannel("gastos-session")` si hay otra pestaña viva y, si responde, hereda la sesión en vez de cerrarla |
| Cierres automáticos acotados | Inactividad, 8 h y navegador reabierto usan `signOut({ scope: "local" })` (no revocan sesiones de otros dispositivos). Antes de cerrar por inactividad se relee `gastos_last_active` (compartido entre pestañas) para no cerrar la sesión si el usuario está activo en otra pestaña |
| Expiración por inactividad prolongada | `gastos_last_active` en `localStorage` actualizado en cada evento de usuario; si la pestaña lleva >8 h sin actividad se cierra la sesión al recuperar el foco |
| Límite en montos | Máximo 10,000,000 (en PEN, la moneda base) validado en cliente y con `max` en el input |
| Error feedback | `loadError` en `DataContext` — banner con botón Reintentar si la carga falla |
| Errores visibles en producción | Los errores del navegador (límites de error de Next, fallos de carga de datos, errores no capturados) se envían con `reportError()` a `/api/client-error`, que los escribe como una línea JSON `[client-error]` en los logs del servidor (Vercel → Logs). Se envía solo el pathname (sin query), con tope de tamaño y de 10 reportes por página. La ruta acepta reportes sin sesión para cubrir las páginas de auth. En producción se conservan `console.error` y `console.warn` |

> Arquitectura del CSP con nonce por request (flujo en `proxy.ts`, render dinámico, cómo verificar): **[SECURITY-CSP.md](SECURITY-CSP.md)**.
