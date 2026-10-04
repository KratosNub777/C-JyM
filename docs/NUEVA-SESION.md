# Traspaso a una sesión nueva

Documento autosuficiente para retomar el proyecto sin explorar el repositorio. Complementa a `docs/ESTADO.md` (bitácora corta) y a `CLAUDE.md` (reglas del proyecto). **No contiene claves ni contraseñas**: esas viven en el administrador de contraseñas del usuario y en las variables de entorno de Vercel.

## 1. Cómo arrancar

Mensaje sugerido para la sesión nueva:

> Leé `CLAUDE.md`, `docs/ESTADO.md` y `docs/NUEVA-SESION.md`. Revisá `git status` y `git log --oneline -5`, y decime qué falta publicar antes de empezar. Seguimos por el pendiente número ___ de la lista.

Antes de tocar nada: `git branch --show-current`, `git status --short` y `git fetch && git log --oneline HEAD..origin/main`. Trabajar siempre en una rama nueva, con commits chicos, y pushear o fusionar **solo cuando el usuario lo pida** (siempre lo pide explícitamente).

## 2. Estado en pocas líneas

- **Producto:** catálogo y tienda de **Comercial José María** (electrodomésticos, Paraguay). Fase 1 (catálogo) y Fase 2 (cuentas) terminadas. Fase 3 (compra) en curso: hay carrito, pedidos con **retiro en el local**, reserva de stock y vencimiento automático. **No hay cobro online todavía.**
- **Stack:** Next.js 16.3.8, Payload CMS 3.90.2 (integrado, `/admin`), Better Auth 1.7 para clientes, Postgres, Meilisearch v1.42.1, Cloudflare R2 para imágenes, Node 22.18, npm 10.9.
- **Staging publicado:** `https://cjym-staging.vercel.app` (Vercel, región `gru1`), con base propia en Neon, Meilisearch en Railway y bucket R2 `cjym-media-staging` (público en `https://pub-8efd880a2684425a83a434897505c0fd.r2.dev`). Ya tiene el catálogo de demostración cargado (16 categorías y 23 productos) y un administrador creado.
- **Producción:** todavía no existe.
- **Ramas:** `main` en `f9e575c` (ya incluye `fix/sitemap-revalidate`, PR #3, desplegado y verificado en staging). La rama `chore/pendientes-calidad` (dependencias, validación de precios, tope de códigos por email, limpieza de cuentas, límites en server actions y menores; ver la tabla de `docs/ESTADO.md`) **no está pusheada ni fusionada**. Es lo primero que hay que publicar.
- **Calidad al último chequeo (2026-10-04):** `tsc` sin errores, lint con 0 errores y 0 advertencias, 128 tests de Vitest en 27 archivos, 16 e2e de Playwright y build de producción correcto. `npm audit`: 0 críticas; las 12 altas que quedan son de herramientas de build sin arreglo publicado.
- **Dos bases de Neon distintas.** La de **desarrollo** (`.env`, servidor `ep-holy-poetry-…`) la usan los tests y el desarrollo local. La de **staging** (servidor `ep-little-queen-…`) es la del sitio publicado. Confundirlas es el error más fácil de cometer: comprobar siempre el nombre del servidor antes de ejecutar nada que escriba.

## 3. Mapa de documentos

| Archivo | Para qué |
| --- | --- |
| `CLAUDE.md` | Reglas, convenciones y estructura del proyecto (local, ignorado por git) |
| `docs/ESTADO.md` | Bitácora corta: último trabajo y pendientes |
| `docs/despliegue.md` | Puesta en marcha: Neon, migraciones, variables, Vercel, R2, primer arranque, lista de verificación |
| `docs/meilisearch.md` | Meilisearch en Railway, claves y sincronización |
| `docs/pagos-diseno.md` | Diseño de pagos con Bancard o Pagopar (propuesta sin implementar) |
| `docs/fase-2-autenticacion.md` | Cuentas, verificación por email, HTTPS y límites |
| `docs/checkout.md`, `docs/carrito.md` | Pedidos, reserva de stock y vencimiento |

## 4. Pendientes por prioridad

### A. Publicar lo que ya está hecho
1. **Pushear y fusionar `chore/pendientes-calidad` a `main`.** Vercel redespliega solo y agrega el segundo cron (`/api/cron/cleanup-accounts`). No necesita migraciones: los contadores nuevos usan la tabla `verification` de Better Auth. Después, en Vercel, cambiar `sslmode=require` por `sslmode=verify-full` en `DATABASE_URL` (misma seguridad, quita el aviso de `pg`).

### B. Staging (requieren acciones del usuario)
2. **Correo (SMTP).** Sin él, **registrarse falla en producción**. El usuario carga `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD` y `SMTP_FROM` en Vercel y se prueba con `npm run email:test -- correo@destino.com`. Gmail sirve con una contraseña de aplicación. Falta verificar en vivo que el envío en segundo plano (`after()`) funciona en Vercel; solo se probó en local.
3. **Sincronizar Meilisearch** contra staging: `npm run meilisearch:sync` con `MEILISEARCH_HOST` y `MEILISEARCH_MASTER_KEY` de Railway y el `DATABASE_URL` de staging. Hoy el índice está vacío y `/buscar` usa el respaldo en Postgres.
4. **Cambiar la contraseña del administrador** de staging (se compartió por el chat) y **borrar** los `.txt` con claves que quedaron en Descargas.
5. **Decidir el dominio propio del bucket R2 antes de cargar el catálogo real.** `r2.dev` tiene límites y no usa caché; además cada foto guarda en la base la dirección con la que se subió, y cambiarla después obliga a actualizar todas.

### C. Producto y negocio
6. **Importación masiva de ~1.000 productos.** No existe. Hace falta saber en qué formato tiene la empresa su catálogo (Excel, sistema de gestión, otro). Un script debería crear categorías y productos como lo hace `scripts/seed-demo.ts` (validación previa, simulación, sin duplicar por `slug`, precios en guaraníes enteros) y manejar las fotos hacia R2. Después, fotos reales.
7. **Elegir la pasarela de pago** (Bancard o Pagopar) y seguir `docs/pagos-diseno.md`. Decisiones abiertas: si se mantiene "pagar en el local", cómo tratar un pago que llega tarde, cuotas reales, y el proveedor de emails transaccionales. Las etapas 1 a 3 (modelo, dominio con un proveedor de prueba y guarda de expiración) no dependen de la elección.
8. **Producción real.** Base de Neon aparte, proyecto de Vercel aparte, bucket `cjym-media`, cuenta de Cloudflare y dominio `.com.py` **a nombre de la empresa**. Plan Vercel Pro (el Hobby es para uso no comercial; el cron diario libera reservas con hasta un día de atraso, y en Pro puede ser cada hora con `0 * * * *`). Al desplegar, **crear el primer administrador de inmediato**: hasta que exista uno, cualquiera puede crearlo.

### D. Seguridad y calidad
9. ~~Actualizar `next`~~ hecho (16.3.8, más `vitest` 4.1.11 y `undici` 7.29.1 por `overrides`). Revisar `npm audit` cuando salga una versión nueva de Payload.
10. ~~Tope de códigos por email y limpieza de cuentas sin verificar~~ hecho: 5 emails con código por hora por dirección, reenvío que reutiliza el código vigente y cron diario que borra cuentas sin verificar de más de 7 días.
11. ~~Server actions sin límite~~ hecho: máximo 3 pedidos pendientes por cliente y límites por minuto en checkout y direcciones. **Confirmar con la empresa** si 3 pedidos pendientes simultáneos está bien.
12. ~~`compareAtPrice > price`~~ hecho (validación en `Products` y en `/catalogar`; corregido el secador en la base de desarrollo).
13. **Subidas por `/admin` en Vercel limitadas a ~4,5 MB.** Si hace falta, activar `clientUploads` en el plugin de R2 y permitir CORS `PUT` desde el sitio.
14. **Variables de entorno de Preview sin configurar en Vercel** (solo están las de Production): los previews fallarían. Usar una base y claves distintas para Preview.
15. **`/code-review` de la Fase 3 y `/security-review` obligatorio** antes de cerrarla.
16. **Menores:** hechos (lint sin advertencias, `/my-route` del template borrada, `sslmode=verify-full` en `.env` y `.env.example`, sin `pnpm` en `package.json`). Falta: `sslmode` en Vercel (punto 1) y revisar respaldo o restauración a un punto en el tiempo de Neon según el plan.

## 5. Comandos útiles

```bash
npm run test:int          # Vitest (contra la base de desarrollo)
npm run test:e2e          # Playwright; corre en serie a propósito
npx tsc --noEmit && npm run lint
npm run build             # prueba de producción
npm run db:setup          # migraciones de Payload + Better Auth (solo bases NUEVAS o de staging/producción)
npm run db:migrate:create -- nombre   # tras editar una colección; luego npm run generate:types
npm run email:test -- correo@destino.com
npm run meilisearch:sync  # y meilisearch:key para crear la clave acotada de la app
npm run seed:demo         # simula; con -- --yes carga el catálogo de demostración (se niega si hay datos)
```

Para cargar variables de **staging** en una PowerShell nueva (los valores salen del administrador de contraseñas; usar `npm.cmd`, porque PowerShell bloquea `npm`):

```powershell
$env:DATABASE_URL = '<la de staging>'
$env:PAYLOAD_SECRET = '<la de staging>'
$env:BETTER_AUTH_SECRET = '<la de staging>'
$env:BETTER_AUTH_URL = 'https://cjym-staging.vercel.app'
([uri]$env:DATABASE_URL).Host    # debe imprimir ep-little-queen-…; si dice ep-holy-poetry-…, NO seguir
```

## 6. Reglas aprendidas en este proyecto

- **Una sola sesión por carpeta, o un `git worktree` por sesión.** Dos sesiones en la misma carpeta se pisaron las ramas y los commits.
- **Nunca enlazar `node_modules` dentro de un worktree.** `git worktree remove` siguió el enlace y borró parte del `node_modules` real; se recuperó con `npm ci`.
- **Ninguna contraseña por el chat.** El agente no puede usarla, y queda escrita en la conversación. Los datos se cargan con scripts que el usuario ejecuta, o desde el panel.
- **Nunca correr `db:migrate` ni los tests contra staging o producción.** La base de desarrollo se creó con el modo automático de Payload; las migraciones son para bases nuevas.
- **Todo cambio de esquema necesita su migración** (`db:migrate:create`) y regenerar los tipos (`generate:types`).
- **Los tests no deben crear ni borrar categorías** (todos usan "la primera existente"): hacerlo chocaba con otros archivos en paralelo y fallaba 1 de cada 5 corridas.
- **El mensaje de cada commit termina con la línea `Co-Authored-By`** indicada en las instrucciones del entorno, y la bitácora `docs/ESTADO.md` se actualiza en el mismo commit que el cambio.
- **`npx prettier --write` sobre una carpeta reescribe finales de línea** de archivos que no se tocaron: pasarle solo los archivos cambiados y, si aparecen de más, restaurar los que tengan `git diff --ignore-space-at-eol` vacío. Si `src/payload-types.ts` cambia de verdad (por ejemplo la descripción de un campo), es por un cambio de colección y se commitea.
- **Después de correr tests, `src/payload-types.ts` puede aparecer modificado** solo por finales de línea de Windows. Si `git diff --ignore-space-at-eol` está vacío, restaurarlo con `git checkout -- src/payload-types.ts`.

## 7. Qué no se probó

- El envío real de correos (no hay SMTP configurado). El tope de 5 códigos por hora se probó con el envío simulado.
- El cron `/api/cron/cleanup-accounts` en Vercel (se probó la ruta y la consulta contra la base de desarrollo; corre por primera vez después de fusionar).
- Un pago online (no existe).
- El panel de administración visualmente al subir fotos en staging (se verificó por API: la imagen quedó en R2 y `next/image` la sirve).
- Cargas altas, rendimiento con ~1.000 productos y el comportamiento del caché de la portada con ese volumen.
