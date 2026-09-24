import type { CollectionConfig } from 'payload'

export const Products: CollectionConfig = {
  slug: 'products',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'category', 'price', 'stock', 'status'],
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      admin: {
        description: 'Usado en la URL, ej: /productos/iphone-15',
      },
    },
    {
      name: 'sku',
      label: 'Código (SKU)',
      type: 'text',
      admin: {
        description: 'Código interno del producto, ej: 211582',
      },
    },
    {
      name: 'description',
      type: 'textarea',
    },
    {
      name: 'brand',
      type: 'text',
    },
    {
      name: 'category',
      type: 'relationship',
      relationTo: 'categories',
      required: true,
    },
    {
      name: 'images',
      type: 'upload',
      relationTo: 'media',
      hasMany: true,
    },
    {
      name: 'price',
      label: 'Precio contado (Gs.)',
      type: 'number',
      required: true,
      min: 0,
    },
    {
      name: 'compareAtPrice',
      label: 'Precio de lista (Gs.), opcional',
      type: 'number',
      min: 0,
      admin: {
        description: 'Precio tachado antes del descuento. Dejar vacío si no hay descuento.',
      },
    },
    {
      name: 'stock',
      type: 'number',
      required: true,
      defaultValue: 0,
      min: 0,
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'active',
      options: [
        { label: 'Activo', value: 'active' },
        { label: 'Inactivo', value: 'inactive' },
      ],
    },
  ],
}
