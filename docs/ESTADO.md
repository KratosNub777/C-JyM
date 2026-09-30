# ESTADO — bitácora para retomar sesiones

> Leer **esto primero** en una sesión nueva; alcanza para retomar sin explorar el repo.
> Se actualiza con cada cambio (ver reglas al final). Máx. ~80 líneas: al pasar, borrar lo más viejo.

## Ahora

- **Fase:** 3 en curso (carrito, checkout con retiro, reserva de stock y vencimiento listos; falta pasarela, confirmación verificada, emails transaccionales y `/security-review`). Detalle en `docs/checkout.md`.
- **Diseño de pagos:** propuesta en `docs/pagos-diseno.md` (Bancard vs Pagopar), aún sin decidir.
- **Rama activa:** `docs/bitacora-de-sesion` (creada desde `main`; contiene el fix de registro y este archivo).

## Trabajo sin commitear

Nada. El fix de cuentas sin verificar (account squatting) quedó commiteado en esta misma rama (`b82a5e3`, `0e51bf1`, `03625b6`); la rama `fix/registro-cuenta-sin-verificar` sigue en `main`, sin commits propios.

- `src/lib/customerAuth/auth.ts`: hook `before` en `/sign-up/email` que borra una cuenta **sin verificar** con el mismo email; las verificadas no se tocan.
- Falta: correr `npm run test:e2e` (auth) para confirmar, y mergear a `main`.

## Últimos cambios (más nuevo arriba)

| Fecha | Rama | Cambio |
|---|---|---|
| 2026-09-29 | docs/bitacora-de-sesion | Fix registro: reemplaza cuenta sin verificar (auth.ts + e2e + doc). Se crea este archivo y se referencia desde `CLAUDE.md`. |
| (previo) | main | `.claude/` deja de versionarse; diseño de pagos Bancard/Pagopar; docs de verificación de email por código y recuperación de contraseña; login con confirmar contraseña. |

## Próximos pasos sugeridos

1. Verificar con e2e y mergear esta rama a `main`.
2. Decidir pasarela (`docs/pagos-diseno.md`) y seguir con Fase 3.

## Reglas de mantenimiento (para Claude)

- Al terminar **cada** cambio (commit o bloque de trabajo): editar "Ahora", "Sin commitear" y agregar una fila arriba en "Últimos cambios" — una línea, con archivos clave, sin pegar código.
- Mantener ≤ ~15 filas en la tabla y ≤ ~80 líneas en total; el historial fino vive en `git log`.
- No duplicar lo que ya está en `CLAUDE.md` ni en `docs/*.md`: solo enlazar.
- Incluirlo en el mismo commit que el cambio que describe.
