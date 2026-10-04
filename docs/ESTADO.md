# ESTADO — bitácora para retomar sesiones

> Leer **esto primero** en una sesión nueva; alcanza para retomar sin explorar el repo.
> Se actualiza con cada cambio (ver reglas al final). Máx. ~80 líneas: al pasar, borrar lo más viejo.
> Para retomar con todo el contexto (estado, pendientes, comandos y cuidados): `docs/NUEVA-SESION.md`.

## Ahora

- **Fase:** 3 en curso (carrito, checkout con retiro, reserva de stock y vencimiento listos; falta pasarela, confirmación verificada, emails transaccionales y `/security-review`). Detalle en `docs/checkout.md`.
- **Camino a publicar:** migraciones de producción y guía listas (`docs/despliegue.md`). Imágenes en **Cloudflare R2** funcionando en staging (foto subida y servida; `next/image` OK). Staging (`cjym-staging.vercel.app`) ya tiene el catálogo demo cargado (16 categorías, 23 productos) y el sitemap nuevo verificado (42 URLs); falta SMTP, correr `meilisearch:sync` y la importación masiva.
- **Calidad (2026-10-04):** tsc OK, lint 0 errores/0 warnings, 128 Vitest en 27 archivos, 16 e2e y build OK. `npm audit`: 0 críticas.
- **Diseño de pagos:** propuesta en `docs/pagos-diseno.md` (Bancard vs Pagopar), aún sin decidir.
- **Rama activa:** `chore/pendientes-calidad` (sin pushear), sale de `main` = `f9e575c` (incluye `fix/sitemap-revalidate`, PR #3).

## Trabajo sin commitear

Nada.

## Últimos cambios (más nuevo arriba)

| Fecha | Rama | Cambio |
|---|---|---|
| 2026-10-04 | chore/pendientes-calidad | Server actions: máximo 3 pedidos pendientes con reserva vigente por cliente (`MAX_PENDING_ORDERS`, código `LIMIT`; evita acaparar stock) y límite por cliente de 10/min en checkout y 20/min en direcciones (`customerAuth/actionLimit.ts`). El contador por ventana se extrae a `customerAuth/windowQuota.ts` (lo usa también el tope de códigos). Tests de tope, reintento, vencidas y límites. |
| 2026-10-04 | chore/pendientes-calidad | Auth: tope de 5 emails con código por hora por destinatario (`customerAuth/codeQuota.ts`, contador en `verification`, sin migración), reenvío con `resendStrategy: 'reuse'` (no anula el código ya recibido) y cron diario `/api/cron/cleanup-accounts` que borra cuentas sin verificar de más de 7 días (`customerAuth/cleanup.ts`, `vercel.json`). Tests de tope, concurrencia, envío real con Better Auth, limpieza y ruta; e2e de auth OK. |
| 2026-10-04 | chore/pendientes-calidad | Menores: se borra la ruta de ejemplo `/my-route` del template (pública, iniciaba Payload sin usarlo) y el arg sin usar del e2e de admin (lint 0 warnings); `package.json` sin `engines.pnpm`/bloque `pnpm` y `npm test` usa npm; `sslmode=verify-full` en `.env.example`, `.env` local y `docs/despliegue.md` (quita el aviso de `pg`, misma validación). |
| 2026-10-04 | chore/pendientes-calidad | `Products` exige `compareAtPrice > price` (validación de campo en `collections/Products.ts`, cubre ediciones parciales; misma regla en `/catalogar` vía `lib/validateProductFields.ts`; test `product-price-validation`). Corregido el secador de pelo en la base de desarrollo (precio de lista → vacío); staging no tenía casos. |
| 2026-10-04 | chore/pendientes-calidad | `next` y `eslint-config-next` 16.3.3 → 16.3.8, `vitest` 4.0.18 → 4.1.11 y `overrides.undici` 7.29.1 (Payload fija 7.29.0): `npm audit` pasa de 2 críticas/13 altas a 0 críticas/12 altas, todas en herramientas de build sin arreglo publicado (`braces` vía `sass`/`chokidar`, `esbuild` viejo de `drizzle-kit`). tsc, lint, 111 Vitest, 16 e2e y build OK. |
| 2026-10-03 | fix/sitemap-revalidate | `sitemap.xml` se generaba una sola vez al compilar y no mostraba productos nuevos hasta redesplegar; ahora `revalidate = 3600` (`app/sitemap.ts` + test). Staging con datos demo verificado (portada, ofertas, búsqueda). Tests: `products-access` ya no crea/borra categorías (chocaba en paralelo con otros archivos, falla ~1 de 5 corridas) y los tests ya no reescriben `payload-types.ts`. |
| 2026-10-02 | feat/datos-demo | `npm run seed:demo` (`scripts/seed-demo.ts`, `lib/demoCatalog.ts`, `scripts/data/demo-catalog.json`): carga 16 categorías y 23 productos de ejemplo; exige `--yes`, se niega si el catálogo no está vacío. Probado en una base local vacía + build y portada. Se corrige un dato del demo (descuento al revés del secador de pelo). |
| 2026-10-02 | feat/almacenamiento-r2 | Imágenes en R2: `lib/storage/r2.ts` + `s3Storage` en `payload.config.ts`, patrón de `next/image`, migración `media_prefix`, variables `R2_*` en `.env.example` y sección 2.1 de `docs/despliegue.md`. Probado contra un S3 local (subida, URL pública, borrado, rechazo de no-imágenes, nombres repetidos no se pisan). Tipos regenerados y `vitest.global-setup.ts` evita que la primera corrida tras cambiar columnas falle (42701). |
| 2026-10-02 | fix/productos-api-solo-activos | La API REST/GraphQL de `products` solo muestra productos activos a visitantes (`collections/Products.ts` + test); staging `cjym-staging.vercel.app` desplegado y primer admin creado; faltan R2 (imágenes), SMTP y cargar productos. |
| 2026-10-02 | feat/migraciones-y-despliegue | Meilisearch fijado en v1.42.1 (`docker-compose.yml`, `docs/meilisearch.md`); probado sync, huérfanos, clave acotada y búsqueda. Base de staging en Neon creada y migrada (`db:setup`); en la guía paso a paso falta Railway/Vercel. |
| 2026-10-01 | feat/migraciones-y-despliegue | Migración inicial de Payload (`migrations/*_initial.ts`), comandos `npm run db:*`, guía `docs/despliegue.md`; se quita el SQL `002`. Probada en Postgres 16 vacío (esquema = dev). |
| 2026-09-30 | main | HTTPS forzado: `lib/security/{https,headers}.ts` (HSTS, `BETTER_AUTH_URL` https obligatoria en producción), cookie del admin Secure, orígenes solo https. |
| 2026-09-30 | main | `npm run email:test` para probar SMTP (`scripts/email-test.ts`, `describeSmtpError` en `lib/email/mailer.ts`). |
| 2026-09-30 | main | Registro: confirmar contraseña, verificación de email por código SMTP, recuperación de contraseña; reemplazo de cuentas sin verificar (`customerAuth/auth.ts`, `docs/fase-2-autenticacion.md`). |
| 2026-09-29 | main | Meilisearch en producción (clave acotada, sync sin huérfanos, respaldo en Postgres), cron diario de reservas, fixes del code-review de la Fase 2; `.claude/` y `AGENTS.md` dejan de versionarse. |

## Pendientes (por prioridad)

**Ya hecho, falta publicar**
1. Pushear y fusionar `chore/pendientes-calidad`. (`fix/sitemap-revalidate` ya está en `main`.)

**Staging (`cjym-staging.vercel.app`) — acciones del usuario**
2. **SMTP:** sin él registrarse falla en producción. Cargar `SMTP_*` en Vercel y probar con `npm run email:test`. Verificar en vivo que el envío con `after()` funciona en Vercel (solo probado en local).
3. Correr `npm run meilisearch:sync` contra staging (índice vacío; `/buscar` usa el respaldo).
4. Cambiar la contraseña del admin (se compartió por chat) y borrar los `.txt` con claves de Descargas.
5. Decidir el dominio propio del bucket R2 **antes** de cargar el catálogo (`r2.dev` es solo para pruebas y cada foto guarda su URL).

**Producto / negocio**
6. Importación masiva de ~1.000 productos (no existe; falta el formato del catálogo de la empresa) y fotos reales.
7. Elegir pasarela (Bancard o Pagopar) y seguir `docs/pagos-diseno.md` (decisiones abiertas: pago en el local, pago tardío, cuotas, proveedor de email).
8. Producción real: Neon aparte, proyecto Vercel aparte, bucket `cjym-media`, cuenta Cloudflare y dominio `.com.py` a nombre de la empresa. Plan Vercel Pro (Hobby es no comercial; el cron diario libera reservas hasta un día tarde).

**Seguridad y calidad**
9. ~~Actualizar `next`~~ hecho (ver tabla). Volver a mirar `npm audit` cuando salga un Payload nuevo (las 12 altas restantes vienen de dependencias de Payload y de `eslint-config-next`).
10. ~~Tope de códigos por email y limpieza de cuentas sin verificar~~ hecho (ver tabla).
11. ~~Server actions sin rate limit~~ hecho (ver tabla). El tope de 3 pedidos pendientes es un valor por defecto: confirmarlo con la empresa.
12. ~~Validar `compareAtPrice > price`~~ hecho (ver tabla).
13. Subidas por `/admin` en Vercel limitadas a ~4,5 MB (evaluar `clientUploads` + CORS en R2).
14. Variables de entorno de **Preview** sin configurar en Vercel (solo Production): los previews no arrancan.
15. `/code-review` de la Fase 3 y `/security-review` obligatorio antes de cerrarla.
16. Menores: hechos (ver tabla). Falta en Vercel cambiar `sslmode=require` → `verify-full` en `DATABASE_URL` (acción del usuario) y revisar respaldo/restauración de Neon según el plan.

**Cuidados para la sesión nueva**
- Una sola sesión por carpeta o un `git worktree` por sesión. Nunca enlazar `node_modules` dentro de un worktree: `git worktree remove` lo siguió y borró el real (se reinstaló con `npm ci`).
- Ninguna contraseña por chat: el agente no puede usarla. Datos a cargar en staging con `npm run seed:demo` (variables de staging en una PowerShell nueva; usar `npm.cmd`).
- Nunca correr `db:migrate` ni los tests contra staging/producción.

## Reglas de mantenimiento (para Claude)

- Al terminar **cada** cambio (commit o bloque de trabajo): editar "Ahora", "Sin commitear" y agregar una fila arriba en "Últimos cambios" — una línea, con archivos clave, sin pegar código.
- Mantener ≤ ~15 filas en la tabla y ≤ ~80 líneas en total; el historial fino vive en `git log`.
- No duplicar lo que ya está en `CLAUDE.md` ni en `docs/*.md`: solo enlazar.
- Incluirlo en el mismo commit que el cambio que describe.
