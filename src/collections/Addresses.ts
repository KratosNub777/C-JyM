import type { CollectionConfig } from 'payload'
import { departments } from '../lib/customerAuth/addressFields'

export const Addresses: CollectionConfig = {
  slug: 'addresses',
  labels: { singular: 'Dirección de cliente', plural: 'Direcciones de clientes' },
  admin: {
    useAsTitle: 'fullName',
    defaultColumns: ['fullName', 'customerId', 'city', 'department', 'isDefault'],
  },
  access: {
    read: ({ req }) => Boolean(req.user),
    create: ({ req }) => Boolean(req.user),
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => Boolean(req.user),
  },
  fields: [
    {
      name: 'customerId',
      type: 'text',
      required: true,
      index: true,
      admin: {
        description: 'ID de Better Auth; independiente de los usuarios internos de Payload.',
      },
    },
    { name: 'fullName', label: 'Destinatario', type: 'text', required: true, maxLength: 120 },
    { name: 'phone', label: 'Teléfono', type: 'text', required: true, maxLength: 30 },
    {
      name: 'department',
      label: 'Departamento',
      type: 'select',
      required: true,
      options: [...departments],
    },
    { name: 'city', label: 'Ciudad', type: 'text', required: true, maxLength: 100 },
    {
      name: 'addressLine',
      label: 'Dirección / referencia',
      type: 'textarea',
      required: true,
      maxLength: 500,
    },
    { name: 'isDefault', label: 'Predeterminada', type: 'checkbox', defaultValue: false },
  ],
}
