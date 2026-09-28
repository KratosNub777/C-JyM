import { unstable_cache } from 'next/cache'
import type { Where } from 'payload'

import { CATALOG_REVALIDATE_SECONDS, PRODUCTS_TAG } from '@/lib/cacheTags'
import { getPayloadClient } from '@/lib/payload'

export const getDistinctBrands = unstable_cache(
  async (where: Where): Promise<string[]> => {
    const payload = await getPayloadClient()
    const { values } = await payload.findDistinct({
      collection: 'products',
      field: 'brand',
      where,
    })

    return values
      .map((value) => value.brand)
      .filter((brand): brand is string => !!brand)
      .sort((a, b) => a.localeCompare(b))
  },
  ['distinct-brands'],
  { tags: [PRODUCTS_TAG], revalidate: CATALOG_REVALIDATE_SECONDS },
)

export const getOnSaleCount = unstable_cache(
  async (where: Where): Promise<number> => {
    const payload = await getPayloadClient()
    const { totalDocs } = await payload.count({
      collection: 'products',
      where: { and: [where, { compareAtPrice: { greater_than: 0 } }] },
    })
    return totalDocs
  },
  ['on-sale-count'],
  { tags: [PRODUCTS_TAG], revalidate: CATALOG_REVALIDATE_SECONDS },
)

export const getPriceBounds = unstable_cache(
  async (where: Where): Promise<{ min: number; max: number } | null> => {
    const payload = await getPayloadClient()
    const { docs } = await payload.find({
      collection: 'products',
      where,
      select: { price: true },
      limit: 500,
      depth: 0,
    })

    if (docs.length === 0) return null

    return docs.reduce(
      (bounds, doc) => ({
        min: Math.min(bounds.min, doc.price),
        max: Math.max(bounds.max, doc.price),
      }),
      { min: docs[0].price, max: docs[0].price },
    )
  },
  ['price-bounds'],
  { tags: [PRODUCTS_TAG], revalidate: CATALOG_REVALIDATE_SECONDS },
)

async function fetchProducts(where: Where, sort: string, page: number, limit: number) {
  const payload = await getPayloadClient()
  return payload.find({
    collection: 'products',
    where,
    sort,
    page,
    limit,
  })
}

export const getCachedProducts = unstable_cache(fetchProducts, ['products-listing'], {
  tags: [PRODUCTS_TAG],
  revalidate: CATALOG_REVALIDATE_SECONDS,
})
