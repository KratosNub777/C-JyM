# Checkout con retiro en el local

Segunda parte de la Fase 3. Desde `/carrito`, el cliente inicia sesión y confirma un pedido en `/checkout`. El carrito se conserva al ingresar o registrarse. Se admite únicamente retiro en el local, sin costo de entrega ni cobro online; el pedido queda `pending_payment`.

## Pedido y stock

- Nombre y teléfono obligatorios, email tomado de la sesión y observaciones opcionales. La dirección predeterminada puede aportar nombre/teléfono, pero no se requiere una dirección para retirar.
- El servidor consulta productos activos y valida cantidades y precios enteros en guaraníes. Un cambio de precio exige revisar el nuevo total y confirmar nuevamente.
- PostgreSQL bloquea productos en orden de ID. La reserva de stock y la creación del pedido comparten una transacción de Payload; cualquier fallo revierte ambas operaciones.
- Se guardan nombre, SKU, cantidad y precios del momento como datos históricos. Cambiar un producto no altera el importe del pedido.
- El cliente usa un UUID por intento. Un bloqueo por cliente y una clave única en la base permiten reintentar sin crear otro pedido ni descontar stock nuevamente. Reutilizar la clave con otros datos se rechaza.
- Si se pierde la respuesta, el navegador conserva el intento en `sessionStorage` y permite verificar el mismo pedido tras recargar esa pestaña. Si el almacenamiento está bloqueado, conserva el intento en memoria mientras la página permanezca abierta.
- El carrito se actualiza después de recibir confirmación; se restan las unidades compradas conservando otros productos agregados durante el checkout.
- Cancelar un pedido pendiente devuelve el stock dentro de otra transacción. Los reintentos concurrentes devuelven stock una sola vez. Un pedido cancelado mantiene su clave de idempotencia y no se recrea al reintentar.

Los pedidos impagos reservan stock durante **24 horas**, según el plazo acordado. Cada pedido guarda `expiresAt`; cambiar `ORDER_RESERVATION_HOURS` solo cambia el plazo de los nuevos pedidos. El proceso automático marca los pedidos vencidos como `expired`, guarda `expiredAt` y devuelve el stock en una única transacción. El detalle del pedido muestra la fecha límite en hora de Paraguay y distingue pedidos vencidos de cancelaciones voluntarias.

La devolución manual y la automática comparten bloqueos y lógica de stock: si coinciden, se devuelve una sola vez. Los pedidos vencidos conservan su clave de idempotencia; reintentarlos no crea un pedido nuevo ni vuelve a reservar productos. Los pedidos anteriores sin fecha límite reciben `createdAt + 24 horas` al procesarlos por primera vez; no se prolonga la reserva desde el momento de la actualización.

Tampoco se debe eliminar un producto con reservas pendientes. Si falta un producto, la operación se revierte, el pedido permanece pendiente y el job informa el error para revisión. Un fallo de un pedido no revierte otras expiraciones ya confirmadas del lote.

El índice actual de Meilisearch no contiene stock. La reserva actualiza PostgreSQL y, después del commit, invalida la caché del catálogo. Un fallo de caché no cambia un pedido confirmado a un error de compra.

## Acceso

Cada Server Action exige sesión de Better Auth. La identidad y el email no se aceptan desde el formulario. `/cuenta/pedidos` y sus detalles filtran siempre por el cliente autenticado, incluso aunque el layout ya haya verificado la sesión.

`Orders` permite lectura a los administradores del CMS. Crear, editar o borrar por REST/GraphQL/panel está bloqueado para que ninguna modificación manual saltee la transacción de stock. Esta entrega no incorpora estados de pago/aprobación/despacho del panel de gestión de la Fase 4.

## Proceso automático

El servicio de expiración vive en `POST /api/cron/expire-orders` (también admite GET para schedulers). Exige `Authorization: Bearer <CRON_SECRET>` con un secreto de al menos 32 caracteres; sin configuración falla cerrado. No acepta IDs ni fechas del solicitante, no devuelve datos de clientes y responde `Cache-Control: no-store`. Usa la hora de PostgreSQL para decidir qué reservas vencieron.

Procesa hasta 25 pedidos por lote con un presupuesto de 20 segundos y bloqueos `FOR UPDATE SKIP LOCKED` para admitir ejecuciones simultáneas. Informa `expired`, `skipped`, `failed`, `backfilled` y `hasMore`. Devuelve HTTP 503 si hay errores, permitiendo al scheduler reintentar. La caché del catálogo se invalida después de las transacciones.

Con el servidor web iniciado, ejecutar en otro proceso:

```powershell
npm run orders:worker
```

El worker consulta el endpoint cada 60 segundos y procesa más lotes si hay pendientes, sin solapar sus propias solicitudes. Requiere `SITE_URL` y `CRON_SECRET`; `RESERVATION_POLL_SECONDS` permite ajustar el intervalo. Fuera de localhost exige HTTPS y no sigue redirects para evitar reenviar el secreto. Para una única ejecución: `npm run orders:expire`.

En producción `vercel.json` programa una llamada diaria (`0 9 * * *`, 06:00 en Paraguay) a `/api/cron/expire-orders`. Vercel envía `Authorization: Bearer <CRON_SECRET>` cuando existe esa variable de entorno, así que solo hay que definir `CRON_SECRET` (al menos 32 caracteres) en el proyecto. Una ejecución diaria es la frecuencia máxima de los planes Hobby y puede liberar el stock hasta un día después del plazo: en un plan Pro conviene cambiar el schedule a `0 * * * *` (cada hora) o menos. [Límites oficiales de Vercel Cron](https://vercel.com/docs/cron-jobs/usage-and-pricing).

Si se necesita precisión de minutos sin cambiar de plan, el worker (`npm run orders:worker`) puede correr como servicio separado (por ejemplo en Railway) con `SITE_URL` y `CRON_SECRET`. En ese caso conviene quitar la entrada de `crons` para no ejecutar dos programadores; ambos son seguros si coinciden porque el servicio usa `FOR UPDATE SKIP LOCKED`. La liberación ocurre en la siguiente ejecución; si el programador se detiene, procesa el atraso al reiniciarse. **El endpoint por sí solo no programa ejecuciones.**

La configuración de desarrollo usa `ORDER_RESERVATION_HOURS=24` y un `CRON_SECRET` generado en `.env` (gitignored). En producción no hay que aplicar SQL a mano: la migración inicial de Payload (`migrations/*_initial.ts`) ya incluye el plazo de reserva (`expires_at`, `expired_at`) y el estado `expired`. Después hay que configurar un `CRON_SECRET` propio y activar el proceso automático (ver [despliegue](despliegue.md)).

## Validación

```powershell
npm run generate:types
npx tsc --noEmit
npm run lint
npm run test:int -- tests/int/checkout.int.spec.ts tests/int/checkout-auth.int.spec.ts tests/int/checkout-client.int.spec.ts
npm run test:int -- tests/int/reservation-expiration.int.spec.ts tests/int/expiration-route.int.spec.ts tests/int/reservation-worker.int.spec.ts
npm run test:e2e -- tests/e2e/checkout.e2e.spec.ts --workers=1
npm run build
```

Las pruebas de base crean productos exclusivos de prueba y los eliminan al finalizar. Cubren compra concurrente de la última unidad, idempotencia, cambios de precio, rollback, aislamiento de clientes y devolución única de stock. Las pruebas de navegador cubren ingreso desde el carrito, confirmación, cancelación, privacidad y recuperación de una respuesta perdida, además de comprobar el layout móvil.

Las pruebas de expiración cubren vencimientos reales en PostgreSQL, carreras entre cancelación y expiración, ejecución repetida, errores y reintentos, pedidos antiguos y límites de lote. El worker se prueba contra un servidor HTTP aislado. El E2E de vencimiento usa el mismo servicio con IDs exclusivos de sus fixtures, sin expirar pedidos ajenos de desarrollo.

## Pendiente para completar la Fase 3

Pasarela Bancard/Pagopar, confirmación verificada de pagos, emails transaccionales, datos reales del local y políticas comerciales. La futura confirmación de pago debe verificar la fecha límite y cambiar el estado dentro de la transacción del pedido, de modo que la expiración nunca libere stock de un pago confirmado. Actualmente la aplicación no registra pagos externos ni estados de pago completado. Las migraciones de producción existen (ver [despliegue](despliegue.md)); cada cambio de esquema de esta fase (estado `paid`, tabla de pagos) necesitará una migración nueva con `npm run db:migrate:create`, porque el push automático del esquema solo aplica en desarrollo. La Fase 3 sigue abierta: requiere revisión de código y seguridad antes de su cierre y lanzamiento.

Referencias de implementación: [transacciones de Payload](https://payloadcms.com/docs/database/transactions) y [bloqueos de PostgreSQL](https://www.postgresql.org/docs/current/explicit-locking.html).
