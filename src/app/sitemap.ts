import type { MetadataRoute } from 'next'

import { getPayloadClient } from '@/lib/payload'
import { getSiteUrl } from '@/lib/site'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl()
  const payload = await getPayloadClient()

  const [{ docs: products }, { docs: categories }] = await Promise.all([
    payload.find({
      collection: 'products',
      where: { status: { equals: 'active' } },
      limit: 2000,
      select: { slug: true, updatedAt: true },
    }),
    payload.find({
      collection: 'categories',
      limit: 200,
      select: { slug: true, updatedAt: true },
    }),
  ])

  return [
    { url: siteUrl, changeFrequency: 'daily', priority: 1 },
    { url: `${siteUrl}/productos`, changeFrequency: 'daily', priority: 0.8 },
    { url: `${siteUrl}/ofertas`, changeFrequency: 'daily', priority: 0.8 },
    ...categories.map((category) => ({
      url: `${siteUrl}/categorias/${category.slug}`,
      lastModified: category.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    })),
    ...products.map((product) => ({
      url: `${siteUrl}/productos/${product.slug}`,
      lastModified: product.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.5,
    })),
  ]
}
