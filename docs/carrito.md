# Carrito: primera parte de la Fase 3

El carrito está disponible para visitantes y clientes en `/carrito`. Se puede agregar desde las tarjetas o la ficha, cambiar cantidades, quitar productos y vaciar con confirmación. El contador del header suma las unidades.

## Datos y disponibilidad

- `localStorage`, clave `c-jym.cart.v1`, guarda únicamente `{ version: 1, items: [{ productId, quantity }] }`. Es un carrito por navegador: iniciar o cerrar sesión no lo cambia; todavía no se sincroniza con una cuenta ni con otros dispositivos.
- Las pestañas del mismo navegador se actualizan mediante eventos de almacenamiento. Si el navegador bloquea el guardado, se conserva una copia en memoria durante la visita.
- `/api/carrito?ids=...` consulta la Local API de Payload y devuelve los productos activos con su precio, stock e imagen actuales. La respuesta no se almacena en caché. Los datos guardados por el navegador nunca definen precios.
- Se vuelve a consultar al agregar, entrar al carrito y recuperar el foco de la ventana. Productos eliminados/inactivos, sin stock o con cantidades superiores al stock se muestran para revisión; no desaparecen silenciosamente.
- Límites defensivos: 100 productos distintos y 999 unidades por producto, además del stock disponible. Se descartan IDs/cantidades inválidos y se recupera un carrito vacío ante almacenamiento corrupto.
- El subtotal omite productos sin disponibilidad. Las cantidades superiores al stock se señalan para que el cliente las ajuste.

El carrito por sí solo no reserva ni descuenta stock. Ahora permite continuar a un [checkout con retiro en el local](checkout.md): el servidor recalcula precios, valida stock y crea un pedido pendiente de pago. La integración de la pasarela sigue pendiente para completar la Fase 3.

## Verificación

```sh
npx tsc --noEmit
npm run lint
npx vitest run tests/int/cart.int.spec.ts
npm run test:e2e -- tests/e2e/cart.e2e.spec.ts --reporter=line --workers=1
npm run build
```

Los E2E consultan productos existentes del catálogo de desarrollo y guardan carritos solo en sus contextos de navegador aislados. No modifican el catálogo ni el stock.
