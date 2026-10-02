# ESTADO — bitácora para retomar sesiones

> Leer **esto primero** en una sesión nueva; alcanza para retomar sin explorar el repo.
> Se actualiza con cada cambio (ver reglas al final). Máx. ~80 líneas: al pasar, borrar lo más viejo.

## Ahora

- **Fase:** 3 en curso (carrito, checkout con retiro, reserva de stock y vencimiento listos; falta pasarela, confirmación verificada, emails transaccionales y `/security-review`). Detalle en `docs/checkout.md`.
- **Camino a publicar:** migraciones de producción y guía listas (`docs/despliegue.md`). Bloqueo: las imágenes de `Media` van a disco local; **decidido usar Cloudflare R2** (aún sin implementar).
- **Diseño de pagos:** propuesta en `docs/pagos-diseno.md` (Bancard vs Pagopar), aún sin decidir.
- **Rama activa:** `feat/migraciones-y-despliegue` (pusheada, sin fusionar a `main`).

## Trabajo sin commitear

Nada. `main` = `origin/main` (`91fc8f3`). La rama activa está pusheada.

## Últimos cambios (más nuevo arriba)

| Fecha | Rama | Cambio |
|---|---|---|
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
