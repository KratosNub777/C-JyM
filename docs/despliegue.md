# Puesta en marcha (staging y producción)

Guía para publicar el catálogo con Vercel (app y panel), Neon (Postgres) y Railway (Meilisearch). Sirve igual para un entorno de pruebas (staging) y para producción: se repite con otra base y otras claves.

> **Antes de empezar, hay un bloqueo:** las imágenes de `Media` se guardan en el disco local (`/media`). En Vercel el disco es efímero y de solo lectura, así que las subidas desde `/admin` fallarían o se perderían. Hace falta almacenamiento de objetos (por ejemplo Cloudflare R2 o Vercel Blob con el plugin de Payload) **antes de cargar productos reales**. Ver [Pendientes conocidos](#pendientes-conocidos).

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
2. Cargar categorías y productos desde `/admin` (la importación masiva de ~1.000 productos todavía no existe, ver pendientes).
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
| **Almacenamiento de imágenes** (`Media` usa disco local) | Bloquea cargar productos con fotos en Vercel. Hay que elegir R2 o Vercel Blob, instalar el plugin de Payload y actualizar `images` de `next.config.ts` |
| Importación masiva de productos | Cargar ~1.000 productos a mano no es viable |
| Pasarela de pago | Los pedidos quedan pendientes y se pagan en el local. Ver [pagos-diseno.md](pagos-diseno.md) |
| Tope de códigos por email | El límite actual es solo por IP |
| Plan de Vercel | Cron diario en Hobby; Hobby no es para uso comercial |
