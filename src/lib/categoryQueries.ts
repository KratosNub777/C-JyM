import { unstable_cache } from 'next/cache'

import { CATALOG_REVALIDATE_SECONDS, CATEGORIES_TAG, PRODUCTS_TAG } from '@/lib/cacheTags'
import { getPayloadClient } from '@/lib/payload'

export const getCachedCategoryBySlug = unstable_cache(
  async (slug: string) => {
    const payload = await getPayloadClient()
    const { docs } = await payload.find({
      collection: 'categories',
      where: { slug: { equals: slug } },
      limit: 1,
    })
    return docs[0] ?? null
  },
  ['category-by-slug'],
  { tags: [CATEGORIES_TAG], revalidate: CATALOG_REVALIDATE_SECONDS },
)

export const getCachedChildCategories = unstable_cache(
  async (categoryId: number) => {
    const payload = await getPayloadClient()
    const { docs } = await payload.find({
      collection: 'categories',
      where: { parent: { equals: categoryId } },
      limit: 50,
      depth: 0,
    })
    return docs
  },
  ['child-categories'],
  { tags: [CATEGORIES_TAG], revalidate: CATALOG_REVALIDATE_SECONDS },
)

export const getCachedHomeData = unstable_cache(
  async () => {
    const payload = await getPayloadClient()

    const [
      { docs: subcategories },
      { docs: allCategories },
      { docs: activeProducts },
      { docs: productCategories },
    ] = await Promise.all([
      payload.find({
        collection: 'categories',
        where: { parent: { exists: true } },
        limit: 500,
        sort: 'name',
        depth: 0,
      }),
      payload.find({
        collection: 'categories',
        limit: 500,
        sort: 'name',
        depth: 1,
      }),
      // shortcut: los estantes salen de los 200 más nuevos; subir si una categoría deja de aparecer.
      payload.find({
        collection: 'products',
        where: { status: { equals: 'active' } },
        limit: 200,
        depth: 1,
        sort: '-createdAt',
      }),
      // Solo la categoría de cada producto activo: alcanza para contar sin tope de 200.
      payload.find({
        collection: 'products',
        where: { status: { equals: 'active' } },
        pagination: false,
        select: { category: true },
        depth: 0,
      }),
    ])

    const productCounts: Record<number, number> = {}
    for (const { category } of productCategories) {
      const id = typeof category === 'object' ? category.id : category
      productCounts[id] = (productCounts[id] ?? 0) + 1
    }

    return { subcategories, allCategories, activeProducts, productCounts }
  },
  ['home-data'],
  { tags: [PRODUCTS_TAG, CATEGORIES_TAG], revalidate: CATALOG_REVALIDATE_SECONDS },
)
