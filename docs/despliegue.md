# Puesta en marcha (staging y producción)

Guía para publicar el catálogo con Vercel (app y panel), Neon (Postgres) y Railway (Meilisearch). Sirve igual para un entorno de pruebas (staging) y para producción: se repite con otra base y otras claves.

> **Imágenes:** en Vercel el disco es efímero, así que las fotos de `Media` se guardan en **Cloudflare R2** (sección 2.1). Hasta que `R2_BUCKET` y sus variables estén cargadas en Vercel, las subidas desde `/admin` no se conservan.

## Resumen del orden

1. Crear la base en Neon y correr las migraciones.
2. Levantar Meilisearch en Railway y crear su clave.
3. Crear el proyecto en Vercel con las variables de entorno.
4. Desplegar, crear el **primer administrador de inmediato** y cargar contenido.
5. Sincronizar Meilisearch y recorrer la lista de verificación.

## 1. Base de datos (Neon)

- Crear un proyecto (o una rama) **distinto para staging y para producción**. Los tests de desarrollo crean y borran datos: nunca apuntarlos a estas bases.
- Usar la cadena de conexión **con pooler** (el host lleva `-pooler`). Cada instancia serverless abre conexiones y sin pooler se agotan.
- La cadena termina en `?sslmode=require`. `pg` avisa que ese modo pasará a significar otra cosa; para conservar la validación completa del certificado usar `?sslmode=verify-full`.

### Migraciones

Payload no crea las tablas solo en producción (el push automático es solo de desarrollo). El esquema vive en `migrations/*_initial.ts` y se aplica así:

```bash
# Con las variables de la base de destino cargadas (DATABASE_URL, PAYLOAD_SECRET, BETTER_AUTH_SECRET, BETTER_AUTH_URL):
npm run db:setup
```

`db:setup` corre las migraciones de Payload y después las de Better Auth (`user`, `session`, `account`, `verification`, `rate_limit`). Es repetible: una segunda corrida no cambia nada. En una base nueva, Better Auth imprime primero `Database schema mismatch / Missing tables`: es su chequeo previo y a continuación crea las tablas (termina con `Tablas de clientes actualizadas.`). Para ver el estado: `npm run db:migrate:status`.

Reglas:

- **Nunca correr `db:migrate` contra la base de desarrollo.** Se creó con el modo automático y Payload propondría borrar datos.
- Todo cambio en una colección necesita su migración: `npm run db:migrate:create -- nombre`, revisarla y commitearla junto con el cambio. Después de eso `npm run generate:types`.
- Deshacer la última: `npm run db:migrate:down`. Solo sirve mientras no haya datos que dependan del cambio.
- Antes de un cambio de esquema en producción, comprobar que Neon tenga el respaldo/restauración a un punto en el tiempo habilitado en el plan elegido.

**Comprobado:** la migración inicial se aplicó sobre un Postgres 16 vacío y su esquema (columnas, índices, enums y restricciones) coincide con el de la base de desarrollo. La app de producción arrancó contra ella y respondió en `/`, `/productos`, `/buscar`, `/ingresar`, `/registrarse`, `/carrito`, `/admin`, `/api/auth/ok` y `/sitemap.xml`.

## 2. Meilisearch (Railway)

Seguir [meilisearch.md](meilisearch.md): servicio con la imagen oficial, volumen en `/meili_data`, `MEILI_ENV=production`, dominio HTTPS y una clave acotada al índice `products` (`npm run meilisearch:key`). Si Meilisearch no está disponible, `/buscar` busca en Postgres, así que no bloquea el lanzamiento.

## 2.1 Imágenes (Cloudflare R2)

Las fotos se suben desde `/admin` por el servidor y quedan en un bucket de R2; la web las muestra pidiéndolas directamente a la dirección pública del bucket.

1. En Cloudflare, **R2**: activar el servicio (pide un método de pago; hay una capa gratuita mensual) y crear un bucket por entorno (`cjym-media-staging`, `cjym-media`).
2. En el bucket, **Settings → Public Development URL → Enable**. Esa dirección (`https://pub-….r2.dev`) es `R2_PUBLIC_URL`. **`r2.dev` es solo para pruebas**: tiene límites de tasa y no usa caché de Cloudflare. Para producción conectar un **dominio propio** al bucket (Settings → Custom Domains) y usar esa dirección.
3. **R2 → Manage R2 API Tokens → Create API token**, con permiso **Object Read & Write** y limitado a ese bucket. Cloudflare muestra el *Access Key ID* y el *Secret Access Key* una sola vez: guardarlos en el administrador de contraseñas.
4. Cargar en Vercel `R2_BUCKET`, `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY` y `R2_PUBLIC_URL` (ver la tabla). Sin `R2_BUCKET`, la app usa el disco local (solo desarrollo).
5. Comprobar: subir una imagen en `/admin → Media` y abrir su URL en el navegador; debe empezar con `R2_PUBLIC_URL`.

Detalles:

- **El esquema no cambia entre entornos:** la migración `media_prefix` agrega las columnas del plugin aunque R2 esté apagado.
- **No hace falta configurar CORS** en el bucket, porque las subidas pasan por el servidor.
- **Límite de Vercel:** una función acepta cuerpos de hasta unos 4,5 MB, así que una foto más grande no se puede subir por `/admin`. Reducirla antes, o activar `clientUploads` en el plugin (las subidas van directo al bucket y exige permitir CORS `PUT` desde el sitio).
- **Fotos ya subidas con otra dirección:** la URL se guarda en cada documento al subirlo; si se cambia `R2_PUBLIC_URL` (por ejemplo al pasar a un dominio propio) las imágenes existentes conservan la dirección vieja y hay que actualizarlas o volver a subirlas. Conviene decidir el dominio antes de cargar el catálogo.

## 3. Variables de entorno

Generar cada secreto con un valor distinto por entorno:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

| Variable | Obligatoria | Valor |
| --- | --- | --- |
| `DATABASE_URL` | Sí | Cadena de Neon con pooler (ver arriba) |
| `PAYLOAD_SECRET` | Sí | Secreto aleatorio |
| `BETTER_AUTH_SECRET` | Sí | Otro secreto aleatorio, distinto del de Payload, de al menos 32 caracteres |
| `BETTER_AUTH_URL` | Sí | URL pública con `https://`, sin barra final. **Sin ella, o con `http://`, la app no arranca en producción** |
| `BETTER_AUTH_TRUSTED_ORIGINS` | No | Otros orígenes `https://` desde los que se inicia sesión (por ejemplo la variante con o sin `www`). Los previews de Vercel se agregan solos |
| `SITE_URL` | Sí | La misma URL pública `https://`; alimenta metadata, sitemap y robots. Se necesita durante el build |
| `CRON_SECRET` | Sí | Al menos 32 caracteres. Vercel lo envía como `Bearer` al cron; sin él el vencimiento de reservas responde 401 |
| `ORDER_RESERVATION_HOURS` | No | 1 a 168, por defecto 24 |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM` | Sí | Envío de códigos de verificación. **Sin SMTP en producción, registrarse falla.** Probar antes con `npm run email:test -- correo@destino.com` |
| `R2_BUCKET`, `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_PUBLIC_URL` | Sí | Almacenamiento de imágenes en Cloudflare R2 (sección 2.1). `R2_PUBLIC_URL` con `https://` y sin barra final. Si falta alguna con `R2_BUCKET` definido, la app no arranca y el mensaje dice cuál |
| `MEILISEARCH_HOST` | Sí* | URL HTTPS del servicio en Railway |
| `MEILISEARCH_API_KEY` | Sí* | La clave acotada de `npm run meilisearch:key`, **no** la maestra |

\* Sin Meilisearch la búsqueda usa el respaldo en Postgres.

No cargar en Vercel: `MEILISEARCH_MASTER_KEY` (es solo para los scripts locales), `RESERVATION_POLL_SECONDS` (es del worker opcional) ni `CI`.

## 4. Vercel

1. Importar el repositorio de GitHub. Framework: Next.js. Se instala con `npm ci` (el `.npmrc` ya activa `legacy-peer-deps`).
2. **Build Command:** `npm run db:setup && npm run build`. El build prerenderiza la portada consultando la base, por lo que las tablas tienen que existir antes de compilar; así cada despliegue aplica sus migraciones pendientes y falla si algo no corresponde.
   - Si se prefiere no migrar durante el build, correr `npm run db:setup` a mano contra la base antes de cada despliegue y dejar `npm run build`.
3. Cargar las variables del cuadro anterior en **Production** y, con otra base y otras claves, en **Preview**. Un preview con las variables de producción escribiría en la base real.
4. La región de las funciones (`gru1`, São Paulo) y el cron ya están en `vercel.json`.
   - El cron llama a `/api/cron/expire-orders` una vez por día: es el máximo del plan gratuito. Con reservas de 24 h puede liberar el stock hasta un día tarde. En un plan Pro cambiar `schedule` a `0 * * * *` (cada hora) o menos.
   - El plan Hobby de Vercel está pensado para uso personal y no comercial (verificar los términos vigentes): para publicar la tienda real conviene el plan Pro.
5. Agregar el dominio `.com.py` (registrado a nombre de la empresa en NIC Paraguay). Vercel redirige HTTP a HTTPS y emite el certificado; la app además envía `Strict-Transport-Security`.

## 5. Primer arranque

1. **Crear el primer administrador enseguida.** Mientras no exista ningún usuario, `POST /api/users/first-register` y la pantalla de `/admin` permiten crear el primero a cualquiera que llegue antes. Hacerlo inmediatamente después del primer despliegue y **antes de difundir la URL**. Desde entonces esa ruta responde 403.
2. Cargar categorías y productos. Para **ver el sitio con datos de demostración** (16 categorías y 23 productos de ejemplo, los mismos del desarrollo) hay un script que no necesita iniciar sesión en el panel, porque escribe directo en la base:

   ```powershell
   # En una PowerShell nueva, con las variables del entorno de destino (como en el paso de db:setup).
   # DATABASE_URL debe ser la base de staging; el script imprime el servidor al que apunta.
   npm.cmd run seed:demo                  # solo muestra qué haría
   npm.cmd run seed:demo -- --yes         # lo carga; se niega si el catálogo ya tiene datos
   ```

   Opciones: `--force` agrega solo lo que falte en un catálogo con datos (nunca duplica por slug) y `--with-media` pone la primera imagen de Media en todos los productos. **No usarlo en la base de producción real.** Después correr `npm run meilisearch:sync` y esperar hasta 5 minutos a que la portada refresque su caché. El catálogo real se carga desde `/admin` o con la importación masiva (ver pendientes).
3. Sincronizar la búsqueda desde tu máquina, con las variables del entorno de destino:

   ```bash
   MEILISEARCH_HOST=https://... MEILISEARCH_MASTER_KEY=... DATABASE_URL=... npm run meilisearch:sync
   ```

## 6. Lista de verificación

Recorrerla con la URL pública:

- [ ] `https://…/` carga, y `http://…/` redirige a `https`.
- [ ] Las cabeceras de la portada incluyen `strict-transport-security`.
- [ ] `/productos`, una ficha y `/buscar?q=…` muestran productos.
- [ ] `/admin` pide iniciar sesión y `/api/auth/ok` responde `{"ok":true}`.
- [ ] Registrarse con un correo real: llega el código, se verifica y queda con sesión.
- [ ] Salir, entrar de nuevo y recuperar la contraseña con el código.
- [ ] Agregar al carrito, confirmar un pedido de prueba y ver el plazo de reserva en la cuenta.
- [ ] Cancelar ese pedido y comprobar que el stock vuelve.
- [ ] `curl -H "Authorization: Bearer $CRON_SECRET" https://…/api/cron/expire-orders` responde 200, y sin la cabecera responde 401.
- [ ] `sitemap.xml` y `robots.txt` apuntan al dominio `https` correcto.

## 7. Operación

- **Cambios de esquema:** migración nueva, commit, despliegue (el build la aplica). Probarla antes sobre una copia de la base o sobre staging.
- **Rotar un secreto:** cambiarlo en Vercel y redesplegar. Rotar `BETTER_AUTH_SECRET` deja sin validar los códigos pendientes (están cifrados con él) y puede cerrar sesiones. Rotar `CRON_SECRET` obliga a actualizar cualquier worker externo.
- **Meilisearch caído:** la búsqueda sigue con el respaldo. Al recuperarlo, `npm run meilisearch:sync` deja el índice al día.
- **Los tests no se corren nunca contra estas bases.**

## Pendientes conocidos

| Pendiente | Impacto |
| --- | --- |
| Almacenamiento de imágenes | Resuelto en el código con R2; falta cargar las variables `R2_*` en Vercel y, para producción, un dominio propio en el bucket |
| Importación masiva de productos | Cargar ~1.000 productos a mano no es viable |
| Pasarela de pago | Los pedidos quedan pendientes y se pagan en el local. Ver [pagos-diseno.md](pagos-diseno.md) |
| Tope de códigos por email | El límite actual es solo por IP |
| Plan de Vercel | Cron diario en Hobby; Hobby no es para uso comercial |
