# ESTADO — bitácora para retomar sesiones

> Leer **esto primero** en una sesión nueva; alcanza para retomar sin explorar el repo.
> Se actualiza con cada cambio (ver reglas al final). Máx. ~80 líneas: al pasar, borrar lo más viejo.

## Ahora

- **Fase:** 3 en curso (carrito, checkout con retiro, reserva de stock y vencimiento listos; falta pasarela, confirmación verificada, emails transaccionales y `/security-review`). Detalle en `docs/checkout.md`.
- **Camino a publicar:** migraciones de producción y guía listas (`docs/despliegue.md`). Imágenes en **Cloudflare R2** funcionando en staging (foto subida y servida; `next/image` OK). Staging (`cjym-staging.vercel.app`) ya tiene el catálogo demo cargado (16 categorías, 23 productos); falta SMTP, correr `meilisearch:sync` y la importación masiva.
- **Diseño de pagos:** propuesta en `docs/pagos-diseno.md` (Bancard vs Pagopar), aún sin decidir.
- **Rama activa:** `fix/sitemap-revalidate` (sin pushear). `main` = `b9f05ff`.

## Trabajo sin commitear

Nada. `main` = `origin/main` (`91fc8f3`). La rama activa está pusheada.

## Últimos cambios (más nuevo arriba)

| Fecha | Rama | Cambio |
|---|---|---|
| 2026-10-03 | fix/sitemap-revalidate | `sitemap.xml` se generaba una sola vez al compilar y no mostraba productos nuevos hasta redesplegar; ahora `revalidate = 3600` (`app/sitemap.ts` + test). Staging con datos demo verificado (portada, ofertas, búsqueda). |
| 2026-10-02 | feat/datos-demo | `npm run seed:demo` (`scripts/seed-demo.ts`, `lib/demoCatalog.ts`, `scripts/data/demo-catalog.json`): carga 16 categorías y 23 productos de ejemplo; exige `--yes`, se niega si el catálogo no está vacío. Probado en una base local vacía + build y portada. Se corrige un dato del demo (descuento al revés del secador de pelo). |
| 2026-10-02 | feat/almacenamiento-r2 | Imágenes en R2: `lib/storage/r2.ts` + `s3Storage` en `payload.config.ts`, patrón de `next/image`, migración `media_prefix`, variables `R2_*` en `.env.example` y sección 2.1 de `docs/despliegue.md`. Probado contra un S3 local (subida, URL pública, borrado, rechazo de no-imágenes, nombres repetidos no se pisan). Tipos regenerados y `vitest.global-setup.ts` evita que la primera corrida tras cambiar columnas falle (42701). |
| 2026-10-02 | fix/productos-api-solo-activos | La API REST/GraphQL de `products` solo muestra productos activos a visitantes (`collections/Products.ts` + test); staging `cjym-staging.vercel.app` desplegado y primer admin creado; faltan R2 (imágenes), SMTP y cargar productos. |
| 2026-10-02 | feat/migraciones-y-despliegue | Meilisearch fijado en v1.42.1 (`docker-compose.yml`, `docs/meilisearch.md`); probado sync, huérfanos, clave acotada y búsqueda. Base de staging en Neon creada y migrada (`db:setup`); en la guía paso a paso falta Railway/Vercel. |
| 2026-10-01 | feat/migraciones-y-despliegue | Migración inicial de Payload (`migrations/*_initial.ts`), comandos `npm run db:*`, guía `docs/despliegue.md`; se quita el SQL `002`. Probada en Postgres 16 vacío (esquema = dev). |
| 2026-09-30 | main | HTTPS forzado: `lib/security/{https,headers}.ts` (HSTS, `BETTER_AUTH_URL` https obligatoria en producción), cookie del admin Secure, orígenes solo https. |
| 2026-09-30 | main | `npm run email:test` para probar SMTP (`scripts/email-test.ts`, `describeSmtpError` en `lib/email/mailer.ts`). |
| 2026-09-30 | main | Registro: confirmar contraseña, verificación de email por código SMTP, recuperación de contraseña; reemplazo de cuentas sin verificar (`customerAuth/auth.ts`, `docs/fase-2-autenticacion.md`). |
| 2026-09-29 | main | Meilisearch en producción (clave acotada, sync sin huérfanos, respaldo en Postgres), cron diario de reservas, fixes del code-review de la Fase 2; `.claude/` y `AGENTS.md` dejan de versionarse. |

## Próximos pasos sugeridos

1. Fusionar `feat/migraciones-y-despliegue` a `main` cuando se revise.
2. Almacenamiento de imágenes en Cloudflare R2 (plugin de Payload + `next.config.ts` + migración si cambia el esquema).
3. Importación masiva de productos (~1.000) y despliegue de pruebas (Neon + Vercel + Railway).
4. Decidir pasarela (`docs/pagos-diseno.md`) y seguir con Fase 3.

## Reglas de mantenimiento (para Claude)

- Al terminar **cada** cambio (commit o bloque de trabajo): editar "Ahora", "Sin commitear" y agregar una fila arriba en "Últimos cambios" — una línea, con archivos clave, sin pegar código.
- Mantener ≤ ~15 filas en la tabla y ≤ ~80 líneas en total; el historial fino vive en `git log`.
- No duplicar lo que ya está en `CLAUDE.md` ni en `docs/*.md`: solo enlazar.
- Incluirlo en el mismo commit que el cambio que describe.
