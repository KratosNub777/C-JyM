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

const meiliHost = () => process.env.MEILISEARCH_HOST || 'http://localhost:7700'

let client: Meilisearch | null = null

// Cliente de la app (búsqueda y hooks de Products): alcanza con una clave acotada al índice
// `products` (ver `npm run meilisearch:key`), no hace falta la clave maestra.
export function getMeiliClient() {
  if (!client) {
    client = new Meilisearch({
      host: meiliHost(),
      apiKey: process.env.MEILISEARCH_API_KEY,
      timeout: 5000,
    })
  }
  return client
}

// Solo para scripts que configuran el índice o crean claves. Si no hay `MEILISEARCH_MASTER_KEY`
// cae en `MEILISEARCH_API_KEY`, que en desarrollo es la clave maestra.
export function getMeiliAdminClient() {
  return new Meilisearch({
    host: meiliHost(),
    apiKey: process.env.MEILISEARCH_MASTER_KEY || process.env.MEILISEARCH_API_KEY,
    timeout: 30_000,
  })
}

// Documentos del índice que ya no corresponden a un producto activo.
export function findStaleIds(indexedIds: Iterable<number>, activeIds: Iterable<number>): number[] {
  const active = new Set(activeIds)
  return [...indexedIds].filter((id) => !active.has(id))
}

export function getProductsIndex() {
  return getMeiliClient().index<ProductDocument>(PRODUCTS_INDEX)
}

export function toProductDocument(product: Product): ProductDocument {
  return {
    id: product.id,
    name: product.name,
    brand: product.brand ?? null,
    sku: product.sku ?? null,
    description: product.description ?? null,
    price: product.price,
    compareAtPrice: product.compareAtPrice ?? null,
    category: typeof product.category === 'object' ? product.category.id : product.category,
  }
}

export async function syncProductToIndex(product: Product) {
  const index = getProductsIndex()

  if (product.status !== 'active') {
    await index.deleteDocument(product.id)
    return
  }

  await index.addDocuments([toProductDocument(product)])
}

export async function removeProductFromIndex(productId: number) {
  await getProductsIndex().deleteDocument(productId)
}
