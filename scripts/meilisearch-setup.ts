import 'dotenv/config'

import {
  findStaleIds,
  getMeiliAdminClient,
  PRODUCTS_INDEX,
  toProductDocument,
  type ProductDocument,
} from '@/lib/meilisearch'
import { getPayloadClient } from '@/lib/payload'

async function main() {
  const index = getMeiliAdminClient().index<ProductDocument>(PRODUCTS_INDEX)

  await index.updateSettings({
    searchableAttributes: ['name', 'brand', 'description', 'sku'],
    filterableAttributes: ['category'],
    sortableAttributes: ['price'],
  })
  console.log('Configuración del índice actualizada.')

  const payload = await getPayloadClient()
  const activeIds = new Set<number>()
  let page = 1

  while (true) {
    const { docs, hasNextPage } = await payload.find({
      collection: 'products',
      where: { status: { equals: 'active' } },
      limit: 200,
      page,
    })

    if (docs.length > 0) {
      await index.addDocuments(docs.map(toProductDocument))
      docs.forEach((product) => activeIds.add(product.id))
    }

    if (!hasNextPage) break
    page += 1
  }

  console.log(`${activeIds.size} producto(s) indexado(s) en Meilisearch.`)

  // Productos borrados o pasados a inactivos mientras Meilisearch no respondía quedan en el
  // índice porque los hooks solo registran el error; este paso los limpia.
  const indexedIds: number[] = []
  for (let offset = 0; ; offset += 1000) {
    const { results, total } = await index.getDocuments({ fields: ['id'], limit: 1000, offset })
    indexedIds.push(...results.map((doc) => doc.id))
    if (offset + 1000 >= total) break
  }
  const staleIds = findStaleIds(indexedIds, activeIds)
  if (staleIds.length > 0) await index.deleteDocuments(staleIds)
  console.log(`${staleIds.length} documento(s) obsoleto(s) eliminado(s) del índice.`)

  process.exit(0)
}

main().catch((error) => {
  console.error('Error al sincronizar con Meilisearch:', error)
  process.exit(1)
})
