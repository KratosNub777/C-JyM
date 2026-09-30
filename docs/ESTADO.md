# ESTADO — bitácora para retomar sesiones

> Leer **esto primero** en una sesión nueva; alcanza para retomar sin explorar el repo.
> Se actualiza con cada cambio (ver reglas al final). Máx. ~80 líneas: al pasar, borrar lo más viejo.

## Ahora

- **Fase:** 3 en curso (carrito, checkout con retiro, reserva de stock y vencimiento listos; falta pasarela, confirmación verificada, emails transaccionales y `/security-review`). Detalle en `docs/checkout.md`.
- **Diseño de pagos:** propuesta en `docs/pagos-diseno.md` (Bancard vs Pagopar), aún sin decidir.
- **Rama activa:** `main` (local 4+ commits por delante de `origin/main`, sin push).

## Trabajo sin commitear

Nada. Todo está mergeado en `main` local; falta `git push`.

- Fix de registro ya en `main`: `auth.ts` tiene un hook `before` en `/sign-up/email` que borra una cuenta **sin verificar** con el mismo email (evita account squatting); las verificadas no se tocan. e2e de auth 6/6 OK (2026-09-29).

## Últimos cambios (más nuevo arriba)

| Fecha | Rama | Cambio |
|---|---|---|
| 2026-09-29 | main | Merge de `docs/bitacora-de-sesion` y `fix/registro-cuenta-sin-verificar`. e2e de auth 6/6 OK. Fix registro: reemplaza cuenta sin verificar (auth.ts + e2e + doc). Se crea este archivo y se referencia desde `CLAUDE.md`. |
| (previo) | main | `.claude/` deja de versionarse; diseño de pagos Bancard/Pagopar; docs de verificación de email por código y recuperación de contraseña; login con confirmar contraseña. |

## Próximos pasos sugeridos

1. Hacer `git push` de `main` (sin pushear aún).
2. Decidir pasarela (`docs/pagos-diseno.md`) y seguir con Fase 3.

## Reglas de mantenimiento (para Claude)

- Al terminar **cada** cambio (commit o bloque de trabajo): editar "Ahora", "Sin commitear" y agregar una fila arriba en "Últimos cambios" — una línea, con archivos clave, sin pegar código.
- Mantener ≤ ~15 filas en la tabla y ≤ ~80 líneas en total; el historial fino vive en `git log`.
- No duplicar lo que ya está en `CLAUDE.md` ni en `docs/*.md`: solo enlazar.
- Incluirlo en el mismo commit que el cambio que describe.
