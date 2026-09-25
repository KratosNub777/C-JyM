import { Meilisearch } from 'meilisearch'

import type { Product } from '@/payload-types'

export const PRODUCTS_INDEX = 'products'

export type ProductDocument = {
  id: number
  name: string
  brand: string | null
  sku: string | null
  description: string | null
  price: number
  compareAtPrice: number | null
  category: number
}

let client: Meilisearch | null = null

export function getMeiliClient() {
  if (!client) {
    client = new Meilisearch({
      host: process.env.MEILISEARCH_HOST || 'http://localhost:7700',
      apiKey: process.env.MEILISEARCH_API_KEY,
      timeout: 5000,
    })
  }
  return client
}

export function getProductsIndex() {
  return getMeiliClient().index<ProductDocument>(PRODUCTS_INDEX)
}

export async function syncProductToIndex(product: Product) {
  const index = getProductsIndex()

  if (product.status !== 'active') {
    await index.deleteDocument(product.id)
    return
  }

  await index.addDocuments([
    {
      id: product.id,
      name: product.name,
      brand: product.brand ?? null,
      sku: product.sku ?? null,
      description: product.description ?? null,
      price: product.price,
      compareAtPrice: product.compareAtPrice ?? null,
      category: typeof product.category === 'object' ? product.category.id : product.category,
    },
  ])
}

export async function removeProductFromIndex(productId: number) {
  await getProductsIndex().deleteDocument(productId)
}
