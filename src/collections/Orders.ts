import type { CollectionConfig } from 'payload'

// All mutations go through checkout actions so stock and order status stay atomic.
export const Orders: CollectionConfig = {
  slug: 'orders',
  labels: { singular: 'Pedido', plural: 'Pedidos' },
  admin: { defaultColumns: ['id', 'customerName', 'status', 'total', 'createdAt'] },
  access: {
    read: ({ req }) => Boolean(req.user),
    create: () => false,
    update: () => false,
    delete: () => false,
  },
  fields: [
    { name: 'customerId', type: 'text', required: true, index: true },
    { name: 'checkoutKey', type: 'text', required: true, unique: true, admin: { hidden: true } },
    { name: 'requestHash', type: 'text', required: true, admin: { hidden: true } },
    { name: 'customerName', label: 'Nombre', type: 'text', required: true, maxLength: 120 },
    { name: 'customerEmail', label: 'Email', type: 'email', required: true },
    { name: 'phone', label: 'Teléfono', type: 'text', required: true, maxLength: 30 },
    { name: 'notes', label: 'Observaciones', type: 'textarea', maxLength: 500 },
    {
      name: 'fulfillment',
      label: 'Entrega',
      type: 'select',
      required: true,
      options: [{ label: 'Retiro en el local', value: 'pickup' }],
    },
    {
      name: 'status',
      label: 'Estado',
      type: 'select',
      required: true,
      index: true,
      options: [
        { label: 'Pendiente de pago', value: 'pending_payment' },
        { label: 'Cancelado', value: 'cancelled' },
      ],
    },
    { name: 'subtotal', type: 'number', required: true, min: 0 },
    { name: 'shippingFee', label: 'Costo de entrega', type: 'number', required: true, min: 0 },
    { name: 'total', type: 'number', required: true, min: 0 },
    { name: 'cancelledAt', label: 'Cancelado el', type: 'date' },
    {
      name: 'items',
      label: 'Productos',
      type: 'array',
      required: true,
      minRows: 1,
      maxRows: 100,
      fields: [
        { name: 'productId', type: 'number', required: true },
        { name: 'name', label: 'Producto', type: 'text', required: true },
        { name: 'slug', type: 'text', required: true },
        { name: 'sku', type: 'text' },
        { name: 'quantity', label: 'Cantidad', type: 'number', required: true, min: 1 },
        {
          name: 'unitPrice',
          label: 'Precio unitario (Gs.)',
          type: 'number',
          required: true,
          min: 0,
        },
        { name: 'lineTotal', label: 'Subtotal (Gs.)', type: 'number', required: true, min: 0 },
      ],
    },
  ],
}
