# Despliegue y versiones

🌐 **Español** · [English](DEPLOYMENT.en.md)

Cómo se publica un cambio, cómo se versiona y qué revisar cuando algo falla solo en producción.

## Despliegue

- La integración GitHub → Vercel despliega cada push a `main` en producción y crea un **preview** por cada PR.
- La CI (`.github/workflows/ci.yml`) corre lint, typecheck, tests, build y los tests end-to-end en cada PR; conviene mergear solo con la CI en verde.
- Si el cambio toca el esquema, ejecutar antes `supabase/schema.sql` en el SQL Editor de Supabase (ver [DATABASE.md](DATABASE.md#instalar-o-poner-al-día)). Es idempotente: solo agrega lo que falta.
- Despliegue manual: `vercel --prod`. Las variables de entorno se configuran en el Dashboard de Vercel.
- **Speed Insights** (rendimiento real: LCP, INP, CLS…):
  - **Dónde se monta:** `<SpeedInsights />` en `src/app/layout.tsx`, solo cuando `VERCEL` está definida, o sea, en los despliegues de Vercel. En local y en la CI no se monta.
  - **Activarlo:** en el proyecto de Vercel, pestaña **Speed Insights** → **Enable**. Mientras esté desactivado, el script `/_vercel/speed-insights/script.js` responde 404 y no se mide nada.
  - **CSP:** cómo encaja, en [SECURITY-CSP.md](SECURITY-CSP.md#scripts-de-terceros-vercel-speed-insights).

## Cómo mergear un PR

Mergear a `main` publica el cambio en producción. Los pasos, en la página del PR en GitHub:

1. **Revisar:** la pestaña *Files changed* muestra el diff. El preview de Vercel (enlazado en los checks del PR) permite probar el cambio con datos reales antes de mergear.
2. **Esperar la CI en verde:** el check *CI* del último commit debe estar en ✓.
3. **Poner al día la DB, si hace falta:** si el PR cambia `supabase/schema.sql`, ejecutarlo completo en el SQL Editor de Supabase **antes** de mergear. Es idempotente, así que no importa si parte de los cambios ya estaba.
4. **Sacarlo de borrador:** un PR en *Draft* no se puede mergear. Pulsar **Ready for review** al final de la conversación del PR.
5. **Mergear:** **Merge pull request** → **Confirm merge**. Vercel despliega `main` en uno o dos minutos.
6. **Opcional:** **Delete branch** borra la rama del PR.

Desde la terminal, con [GitHub CLI](https://cli.github.com/): `gh pr ready <número>` y luego `gh pr merge <número> --merge`.

## Versiones y releases

- **Dónde vive la versión:**
  - en `package.json`;
  - en la línea **Versión** de los READMEs;
  - en [`CHANGELOG.md`](../CHANGELOG.md). Cada cambio se anota bajo `## [Unreleased]` hasta publicar una versión.
- **Historial:** la numeración se reinició en `0.0.1` y el historial `v1.x` (tags y releases) se descartó.
- **Publicar una versión** (p. ej. `0.0.2`):
  1. En una rama:
     - `npm version 0.0.2 --no-git-tag-version`, que actualiza `package.json` y `package-lock.json`;
     - en el CHANGELOG, renombrar `## [Unreleased]` a `## [0.0.2]`;
     - actualizar la línea **Versión** de ambos READMEs.
  2. Abrir el PR y mergearlo.
  3. En GitHub, ir a **Releases** → **Draft a new release**:
     - tag `v0.0.2` sobre `main` (el tag se crea al publicar);
     - título `v0.0.2`;
     - como notas, la sección de esa versión en el CHANGELOG;
     - **Publish release**.
- **Borrar un release:** en **Releases**, abrir el release y pulsar el ícono de la papelera (**Delete**).
  - Borrar un release **no borra su tag**. El tag se borra aparte, desde la pestaña **Tags** o con `git push origin --delete vX.Y.Z`.
  - Si se borra primero el tag, el release no desaparece: queda como borrador y hay que borrarlo igual.

## Solución de problemas

**Una función parece "rota" solo en producción (www.jeshu.cfd) pero funciona en local.**
Casi siempre es **caché del navegador**: tras un despliegue, el navegador puede combinar el HTML antiguo en caché con los chunks de JavaScript nuevos, ejecutando una mezcla de versiones. La app **no usa Service Worker ni PWA**, así que no hay caché propia que limpiar — es la del navegador.

- **Solución:** *hard refresh* con `Ctrl + Shift + R` (Cmd + Shift + R en Mac) o abrir el sitio en una **ventana de incógnito**.
- Antes de buscar el bug en el código, verifica que el síntoma también se reproduce en **local** (`npm run dev`) y en **incógnito**. Si solo ocurre en producción y el código local es idéntico a `origin/main`, es caché.
- Caso real (2026-06-16): el filtro de fechas del calendario (Gastos/Ingresos) mostraba el chip con la fecha pero dejaba la lista vacía, únicamente en producción. El código era correcto; un *hard refresh* lo resolvió.
