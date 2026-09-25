import { cache } from 'react'

import { getPayloadClient } from '@/lib/payload'

export const getProductBySlug = cache(async (slug: string) => {
  const payload = await getPayloadClient()

  const { docs } = await payload.find({
    collection: 'products',
    where: { slug: { equals: slug } },
    limit: 1,
  })

  return docs[0] ?? null
})
