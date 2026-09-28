import { unstable_cache } from 'next/cache'
import { cache } from 'react'

import { CATALOG_REVALIDATE_SECONDS, PRODUCTS_TAG } from '@/lib/cacheTags'
import { getPayloadClient } from '@/lib/payload'

const getCachedProductBySlug = unstable_cache(
  async (slug: string) => {
    const payload = await getPayloadClient()

    const { docs } = await payload.find({
      collection: 'products',
      where: { slug: { equals: slug } },
      limit: 1,
    })

    return docs[0] ?? null
  },
  ['product-by-slug'],
  { tags: [PRODUCTS_TAG], revalidate: CATALOG_REVALIDATE_SECONDS },
)

// React cache() dedupes within a single request (generateMetadata + page both call this);
// unstable_cache persists the result across requests.
export const getProductBySlug = cache(getCachedProductBySlug)
