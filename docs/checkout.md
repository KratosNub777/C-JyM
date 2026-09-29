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

Los productos permanecen reservados hasta cancelar el pedido. **Todavía no hay vencimiento automático**: antes del lanzamiento comercial hay que acordar un plazo de reserva y el proceso para pedidos impagos. Tampoco se debe eliminar un producto con reservas pendientes; si fue eliminado, la cancelación se detiene para evitar una devolución parcial de stock.

El índice actual de Meilisearch no contiene stock. La reserva actualiza PostgreSQL y, después del commit, invalida la caché del catálogo. Un fallo de caché no cambia un pedido confirmado a un error de compra.

## Acceso

Cada Server Action exige sesión de Better Auth. La identidad y el email no se aceptan desde el formulario. `/cuenta/pedidos` y sus detalles filtran siempre por el cliente autenticado, incluso aunque el layout ya haya verificado la sesión.

`Orders` permite lectura a los administradores del CMS. Crear, editar o borrar por REST/GraphQL/panel está bloqueado para que ninguna modificación manual saltee la transacción de stock. Esta entrega no incorpora estados de pago/aprobación/despacho del panel de gestión de la Fase 4.

## Validación

```powershell
npm run generate:types
npx tsc --noEmit
npm run lint
npm run test:int -- tests/int/checkout.int.spec.ts tests/int/checkout-auth.int.spec.ts tests/int/checkout-client.int.spec.ts
npm run test:e2e -- tests/e2e/checkout.e2e.spec.ts --workers=1
npm run build
```

Las pruebas de base crean productos exclusivos de prueba y los eliminan al finalizar. Cubren compra concurrente de la última unidad, idempotencia, cambios de precio, rollback, aislamiento de clientes y devolución única de stock. Las pruebas de navegador cubren ingreso desde el carrito, confirmación, cancelación, privacidad y recuperación de una respuesta perdida, además de comprobar el layout móvil.

## Pendiente para completar la Fase 3

Pasarela Bancard/Pagopar, confirmación verificada de pagos, expiración acordada de reservas, emails transaccionales, datos reales del local y políticas comerciales. Se necesitan migraciones de producción (incluido el esquema de Orders); el push automático del esquema solo aplica en desarrollo. La Fase 3 sigue abierta: requiere revisión de código y seguridad antes de su cierre y lanzamiento.

Referencias de implementación: [transacciones de Payload](https://payloadcms.com/docs/database/transactions) y [bloqueos de PostgreSQL](https://www.postgresql.org/docs/current/explicit-locking.html).
