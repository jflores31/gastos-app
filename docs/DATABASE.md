# Base de datos

🌐 **Español** · [English](DATABASE.en.md)

Todo el esquema vive en un solo archivo, [`supabase/schema.sql`](../supabase/schema.sql). Esta guía explica qué guarda, cómo instalarlo o ponerlo al día, qué parte depende de Supabase y cómo llevar la app y sus datos a otro sistema.

## Tablas

Nueve tablas, todas con `id` (uuid), `user_id` y `updated_at` (lo mantiene un trigger). Los montos se guardan en PEN (soles).

| Tabla | Qué guarda |
|---|---|
| `transactions` | Ingresos y gastos: `tipo` (`INGRESO`/`EGRESO`), `categoria`, `concepto`, `valor` en PEN y `fecha`. También la moneda en que se escribió (`moneda`, `monto_original`, `tasa`), la cuenta (`cuenta_id`, opcional) y `deleted_at` si está en la papelera |
| `budgets` | Un presupuesto por categoría (`UNIQUE (user_id, categoria)`), con su `periodo`: `week`, `month` o `year` |
| `goals` | Metas de ahorro: objetivo, progreso, fecha límite, color e icono (clave de `ICON_CHOICES`, los iconos elegibles de `src/theme/categoryIcons.js`; las metas viejas guardan un glifo de texto) |
| `accounts` | Cuentas bancarias, efectivo y tarjetas (`type`: `bank`, `cash`, `card`), con su saldo a una fecha (`balance`, `balance_at`) |
| `transfers` | Transferencias entre dos cuentas del usuario (`origen`, `destino`, `monto` en PEN, `fecha`, `nota`) |
| `investments` | Inversiones, con su tasa de retorno |
| `debts` | Préstamos, con cuotas y meses restantes |
| `subscriptions` | Suscripciones, con su ciclo (`monthly`/`yearly`) y categoría |
| `custom_categories` | Categorías propias del usuario (nombre, tipo, color e icono) |

**Relaciones:**
- `transactions.cuenta_id`, `transfers.origen` y `transfers.destino` apuntan a `accounts` con `(id, user_id)`, así nadie puede asociar algo a la cuenta de otro usuario. Al borrar una cuenta, `ON DELETE SET NULL (col)` deja en `NULL` solo esa columna: la transacción o la transferencia sigue existiendo.
- `categoria` es texto, sin clave foránea: una clave del catálogo que vive en el código (`CATEGORIES` en `src/data/index.ts`, p. ej. `COMIDA`) o `custom_<id>` para una categoría propia, donde `<id>` es el `id` de `custom_categories`.

**Restricciones** (`CHECK`): `tipo` válido, `valor > 0`, `moneda` entre las 8 de la app, `monto_original` y `tasa` positivos, `type` de cuenta, `periodo` de presupuesto y `tipo` de categoría propia.

**Fuera de estas tablas:** el nombre, el avatar y las categorías favoritas de cada usuario se guardan en su perfil de Supabase Auth (`user_metadata`: `first_name`, `last_name`, `full_name`, `avatar_url`, `fav_categories`), no en una tabla propia. Hay que tenerlo en cuenta al migrar (ver [Datos](#2-datos)). La app no usa Supabase Storage: `avatar_url` solo existe si lo puso un proveedor OAuth (hoy desactivado) y apunta a una imagen de ese proveedor.

## Instalar o poner al día

`supabase/schema.sql` sirve para las dos cosas: crea lo que no existe y deja igual lo que ya está. Se puede ejecutar más de una vez.

- **Requisito:** PostgreSQL 15 o superior (por `ON DELETE SET NULL` de una sola columna). Supabase usa 15 o 17.
- **En Supabase:** SQL Editor → pegar el archivo completo → **Run**.
- **Con psql:** `psql "$DATABASE_URL" -f supabase/schema.sql`.
- **Antes de poner al día una base con datos:** esta consulta tiene que devolver 0 en las dos columnas. Si no, corregir o borrar esas filas primero; de lo contrario, las restricciones fallan y la parte 1 no se aplica.

  ```sql
  SELECT count(*) FILTER (WHERE tipo NOT IN ('INGRESO', 'EGRESO')) AS tipo_invalido,
         count(*) FILTER (WHERE valor <= 0)                       AS valor_invalido
  FROM transactions;
  ```

El archivo tiene dos partes, cada una en su propia transacción: si algo falla dentro de una, esa parte no deja nada a medias.

| Parte | Qué hace | Depende de |
|---|---|---|
| **1 — PostgreSQL estándar** | Tablas, columnas nuevas de versiones anteriores, restricciones, claves foráneas entre tablas, índices y triggers de `updated_at` | Nada: funciona en cualquier Postgres 15+ |
| **2 — Solo Supabase** | Une `user_id` con `auth.users`, activa RLS y exige la verificación en dos pasos a quien la activó | El esquema `auth` de Supabase. En otro Postgres falla con `schema "auth" does not exist` y no aplica nada; la parte 1 queda hecha |

**Cómo se probó** (Postgres 16):
- una base nueva queda idéntica a la que dejaban las 8 migraciones anteriores (columnas, restricciones, índices, políticas, triggers, funciones y permisos), y ejecutarlo dos veces no cambia nada;
- copias de bases de versiones anteriores quedan con el mismo esquema y sin perder datos; una con una transacción de valor 0 falla hasta corregir esa fila, como avisa la consulta de arriba;
- en un Postgres sin Supabase, la parte 1 crea las 9 tablas (se probó guardar una transferencia y borrar una cuenta: sus transacciones quedan sin cuenta) y la parte 2 falla sin tocar nada.

**Rendimiento:** con 200.000 transacciones, cargar las de un usuario tarda ~1,4 ms gracias a los índices `(user_id, …)`; sin ellos eran ~120 ms (recorrido completo de la tabla).

**CLI de Supabase:** `supabase db push` solo aplica archivos de `supabase/migrations/`, en el proyecto enlazado con `supabase link --project-ref <ref>`. Para usar el CLI, copiar `schema.sql` a `supabase/migrations/<AAAAMMDDHHMMSS>_schema.sql`; como es idempotente, también sirve sobre una base que ya lo tiene.

## Qué depende de Supabase

### En el SQL (parte 2)

- **Usuarios:** `user_id` es clave foránea a `auth.users (id)` con `ON DELETE CASCADE`: borrar un usuario borra todas sus filas.
- **Aislamiento (RLS):** una política por tabla (`own <tabla>`; en `custom_categories`, `custom_categories_policy`) deja leer y escribir solo las filas con `user_id = auth.uid()`.
- **Verificación en dos pasos:** una política `RESTRICTIVE` `mfa aal2` por tabla llama a `public.mfa_satisfied()`, que lee `auth.mfa_factors` y el nivel de la sesión en el token (`aal` en `auth.jwt()`: `aal1` con la contraseña, `aal2` después del código). Quien activó un factor TOTP solo ve sus filas con `aal2`.

### En el código

La app habla con Supabase desde pocos lugares; el resto (pestañas, gráficos, `src/data/*`) recibe los datos ya convertidos por los `map*` de `DataContext` y no sabe de dónde vienen.

| Pieza | Archivos | Qué usa de Supabase |
|---|---|---|
| Clientes | `src/lib/supabase.ts`, `src/lib/supabase-server.ts` | `@supabase/ssr` (`createBrowserClient`, `createServerClient`) con `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| Protección de rutas y CSP | `src/proxy.ts`, `src/lib/mfa.ts` | La sesión en cookies (`getUser`, `getSession`) y su `aal`; el CSP permite `*.supabase.co` y el origen de `NEXT_PUBLIC_SUPABASE_URL` |
| Login, registro y contraseña | `src/app/login`, `register`, `forgot-password`, `reset-password`, `auth/callback`; `LoginModal.jsx` | `signInWithPassword`, `signUp`, `resetPasswordForEmail`, `updateUser`, `exchangeCodeForSession` (OAuth, desactivado) |
| Estado de la sesión | `UserContext.tsx`, `DataContext.jsx`, `DashboardStudio.jsx` | `onAuthStateChange`, `getUser`, `signOut` |
| Perfil | `settings/ProfileTab.jsx`, `SettingsPanel.jsx`, `DashboardStudio.jsx`, `OverviewTab.jsx`, `AddTransactionModal.jsx` | `user_metadata` (nombre, avatar, favoritas) y `updateUser` para guardarlo |
| Verificación en dos pasos | `settings/TwoFactorSection.jsx`, `login/page.tsx` | `auth.mfa`: `enroll`, `challengeAndVerify`, `listFactors`, `unenroll` |
| Datos | `DataContext.jsx`, `src/data/fetchAllRows.ts` | PostgREST con supabase-js: `.from(tabla)` con `select`, `insert`, `update` y `delete`; paginación con `.range()` (PostgREST corta en 1000 filas); `PGRST204`, el error de PostgREST por una columna que no existe, para guardar sin ella si la base no está al día |
| Tests end-to-end | `e2e/mock-supabase/` | Un Supabase simulado: imita Auth, PostgREST y MFA, y lee las tablas de `schema.sql` |

> ⚠ **Las consultas confían en RLS.** La carga de datos (`select("*")`) y el vaciado de la papelera a los 30 días (`delete().lt("deleted_at", …)`) no filtran por `user_id`: es la base la que limita cada consulta al usuario de la sesión. Sin RLS, o con una conexión que se lo salte, la carga devolvería las filas de todos y el vaciado borraría la papelera vieja de todos. En otro sistema, esas consultas necesitan su filtro por usuario, o una capa que lo imponga.

## Migrar a otro sistema

Tres cosas se mueven por separado: la base, los datos (incluidos los usuarios) y el código que habla con Supabase. Cuánto trabajo da cada una depende del destino.

| Destino | Base | Usuarios y login | Código |
|---|---|---|---|
| **Otro proyecto de Supabase**, alojado o autoalojado (Docker) | `schema.sql` completo | Se copian con el esquema `auth` (contraseñas y verificación en dos pasos incluidas), con la guía de Supabase para copiar un proyecto | No cambia: solo las variables de entorno |
| **Otro Postgres gestionado** (Neon, RDS, Railway…) + otro sistema de login | Parte 1 de `schema.sql` y un reemplazo de la parte 2 | Se importan en el nuevo sistema | Cambian las piezas de la tabla anterior |
| **Otra base de datos** (no Postgres) | Hay que traducir el esquema (tipos, `CHECK`, claves foráneas con `SET NULL` de una columna) | Igual que arriba | Igual que arriba, y `DataContext` entero |

### 1. Base

1. Ejecutar `supabase/schema.sql` en la base nueva. La parte 1 crea todo lo estándar; la parte 2 falla sin aplicar nada si no hay esquema `auth`, y así tiene que ser.
2. Reemplazar lo que hacía la parte 2:
   - **Usuarios:** una clave foránea de cada `user_id` a la tabla de usuarios del nuevo sistema, con `ON DELETE CASCADE` si al borrar un usuario se deben borrar sus datos.
   - **Aislamiento:** políticas RLS con la función del nuevo sistema que da el usuario actual, o un backend que agregue `WHERE user_id = …` a **todas** las consultas (ver el aviso de arriba).
   - **Verificación en dos pasos:** si el nuevo sistema la ofrece, exigirla también donde se leen los datos, no solo en la pantalla de login.

### 2. Datos

- **Tablas de la app:** con la cadena de conexión de Supabase (Project Settings → Database), exportar solo los datos del esquema `public` e importarlos en la base nueva, **después** de la parte 1 de `schema.sql`. `pg_dump` ordena las tablas según sus claves foráneas: `accounts` antes que `transactions` y `transfers`, que la referencian; las demás no dependen entre sí:

  ```bash
  pg_dump "$SUPABASE_DB_URL" --data-only --schema=public --no-owner -f datos.sql
  psql "$NUEVA_DB_URL" -f datos.sql
  ```

  `pg_dump` tiene que ser de la misma versión mayor que el Postgres de Supabase, o más nueva.

- **Usuarios:** viven en `auth.users`, fuera de `public`. Por cada uno hay que llevar:
  - el `id`: todas las filas de la app lo tienen en `user_id`. Si el nuevo sistema permite importar usuarios con su `id`, se conserva y no hay que tocar nada más; si no, hay que reemplazar el `id` viejo por el nuevo en las 9 tablas;
  - el email y la contraseña: Supabase la guarda con bcrypt (`encrypted_password`). Si el nuevo sistema no acepta hashes bcrypt, cada usuario tendrá que crear una contraseña nueva;
  - el perfil (`raw_user_meta_data`, un JSON): nombre, avatar y categorías favoritas. En el nuevo sistema va en el perfil de cada usuario o en una tabla propia (p. ej. `profiles`), y los archivos que leen `user_metadata` (ver [En el código](#en-el-código)) pasan a leerlo de ahí.

  ```sql
  -- Contiene hashes de contraseñas: guardar el resultado como un secreto y borrarlo al terminar.
  SELECT id, email, encrypted_password, raw_user_meta_data, created_at FROM auth.users;
  ```

- **Verificación en dos pasos:** los secretos TOTP viajan con `auth.mfa_factors` solo entre instancias de Supabase. En otro sistema, quien la tenía activa tendrá que activarla de nuevo.
- **Copia JSON de la app** (Perfil → Tus datos): trae los datos de un usuario, pero no la papelera ni el perfil, y la app todavía no la importa. Sirve como respaldo, no para migrar.

### 3. Código

Cambiar las piezas de la tabla [En el código](#en-el-código). Casi todo el acceso a datos está en `DataContext.jsx`, y la sesión, en `proxy.ts`, `UserContext.tsx` y las páginas de login. Si el nuevo sistema no expone una API tipo PostgREST, `DataContext` pasa a llamar a rutas propias (p. ej. en `src/app/api/`) que consulten la base con el usuario de la sesión. Actualizar también:
- el CSP de `src/proxy.ts` (`connect-src` e `img-src` permiten `*.supabase.co`);
- las variables de entorno (`.env.example`, Vercel);
- el Supabase simulado de los tests end-to-end, o reemplazarlo por uno del nuevo sistema.

### 4. Verificación

Después de migrar, en la app:
- [ ] el login, el registro y la recuperación de contraseña funcionan, y la verificación en dos pasos pide el código;
- [ ] los totales de cada pestaña coinciden con los de antes de migrar;
- [ ] un usuario no ve ni puede modificar las filas de otro (probar con dos cuentas);
- [ ] borrar una cuenta deja sus transacciones sin cuenta, y la papelera vacía solo lo del usuario;
- [ ] `npm run test:e2e` pasa contra el entorno nuevo, o contra su simulado.

## Mantenimiento

**Vaciar la base de datos:** `supabase/seed/reset.sql` deja las 9 tablas a cero (conteo → `TRUNCATE` → verificación) sin tocar el esquema ni los usuarios de `auth.users`. Es **destructivo e irreversible**: borra los datos de todos los usuarios.

**Historia:** hasta septiembre de 2026 el esquema se aplicaba con 8 migraciones fechadas en `supabase/migrations/`, de `20260618000000_init.sql` a `20260927050000_mfa_aal2.sql`. `schema.sql` las reemplaza y pone al día una base que haya quedado en cualquiera de ellas. Siguen en el historial de git (`git log --stat -- supabase/migrations`), y lo que cambió cada una está en el [CHANGELOG](../CHANGELOG.md).
