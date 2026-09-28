import { revalidatePath, revalidateTag } from 'next/cache'
import type { CollectionConfig } from 'payload'

import { CATEGORIES_TAG, REVALIDATE_IMMEDIATELY } from '@/lib/cacheTags'

function revalidateCategoriesCache() {
  try {
    revalidateTag(CATEGORIES_TAG, REVALIDATE_IMMEDIATELY)
    revalidatePath('/')
  } catch (error) {
    console.error('No se pudo revalidar la caché de categorías:', error)
  }
}

export const Categories: CollectionConfig = {
  slug: 'categories',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'parent'],
  },
  access: {
    read: () => true,
  },
  hooks: {
    afterChange: [
      async () => {
        revalidateCategoriesCache()
      },
    ],
    afterDelete: [
      async () => {
        revalidateCategoriesCache()
      },
    ],
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
        description: 'Usado en la URL, ej: /categorias/celulares',
      },
    },
    {
      name: 'parent',
      type: 'relationship',
      relationTo: 'categories',
      admin: {
        description: 'Dejar vacío si es una categoría de primer nivel',
      },
    },
    {
      name: 'bannerImage',
      type: 'upload',
      relationTo: 'media',
      required: false,
      admin: {
        description:
          'Banner promocional opcional para la home (solo aplica a categorías de primer nivel)',
      },
    },
    {
      name: 'bannerLink',
      type: 'text',
      required: false,
      admin: {
        description: 'URL opcional a la que lleva el banner al hacer click',
      },
    },
  ],
}
