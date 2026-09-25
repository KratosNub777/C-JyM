import 'dotenv/config'

import { getProductsIndex } from '@/lib/meilisearch'
import { getPayloadClient } from '@/lib/payload'

async function main() {
  const index = getProductsIndex()

  await index.updateSettings({
    searchableAttributes: ['name', 'brand', 'description', 'sku'],
    filterableAttributes: ['category'],
    sortableAttributes: ['price'],
  })
  console.log('Configuración del índice actualizada.')

  const payload = await getPayloadClient()
  let page = 1
  let total = 0

  while (true) {
    const { docs, hasNextPage } = await payload.find({
      collection: 'products',
      where: { status: { equals: 'active' } },
      limit: 200,
      page,
    })

    if (docs.length > 0) {
      await index.addDocuments(
        docs.map((product) => ({
          id: product.id,
          name: product.name,
          brand: product.brand ?? null,
          sku: product.sku ?? null,
          description: product.description ?? null,
          price: product.price,
          compareAtPrice: product.compareAtPrice ?? null,
          category: typeof product.category === 'object' ? product.category.id : product.category,
        })),
      )
      total += docs.length
    }

    if (!hasNextPage) break
    page += 1
  }

  console.log(`${total} producto(s) indexado(s) en Meilisearch.`)
  process.exit(0)
}

main().catch((error) => {
  console.error('Error al sincronizar con Meilisearch:', error)
  process.exit(1)
})
