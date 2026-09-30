import 'dotenv/config'

import { getMeiliAdminClient, PRODUCTS_INDEX } from '@/lib/meilisearch'

// Crea la clave que usa la app (búsqueda + hooks de Products), acotada al índice `products`.
// No puede cambiar la configuración del índice, borrar índices ni crear otras claves.
// Cada ejecución crea una clave nueva: correrlo una vez por entorno y guardar el resultado
// como MEILISEARCH_API_KEY del despliegue.
async function main() {
  const key = await getMeiliAdminClient().createKey({
    name: 'c-jym-app',
    description: 'Búsqueda y sincronización de productos desde la app',
    actions: ['search', 'documents.add', 'documents.delete'],
    indexes: [PRODUCTS_INDEX],
    expiresAt: null,
  })
  console.log(`Clave creada (uid ${key.uid}). Usala como MEILISEARCH_API_KEY de la app:`)
  console.log(key.key)
  process.exit(0)
}

main().catch((error) => {
  console.error('No se pudo crear la clave de Meilisearch:', error)
  process.exit(1)
})
