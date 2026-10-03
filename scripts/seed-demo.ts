import 'dotenv/config'

import { readFileSync } from 'node:fs'

import { planSeed, validateDemoCatalog, type DemoCatalog } from '@/lib/demoCatalog'
import { getPayloadClient } from '@/lib/payload'

// Carga el catálogo de demostración (scripts/data/demo-catalog.json) en la base a la que apunte
// DATABASE_URL, para ver el sitio con categorías y productos sin cargarlos a mano.
//   npm run seed:demo                       muestra qué haría, sin escribir nada
//   npm run seed:demo -- --yes              lo carga (solo si el catálogo está vacío)
//   npm run seed:demo -- --yes --force      además, agrega lo que falte en un catálogo con datos
//   npm run seed:demo -- --yes --with-media usa la primera imagen de Media en todos los productos
const args = new Set(process.argv.slice(2))
const fail = (message: string): never => {
  console.error(`✗ ${message}`)
  process.exit(1)
}

async function main() {
  const catalog = JSON.parse(readFileSync('scripts/data/demo-catalog.json', 'utf-8')) as DemoCatalog
  const problems = validateDemoCatalog(catalog)
  if (problems.length) fail(`El archivo de datos tiene errores:\n  - ${problems.join('\n  - ')}`)

  if (!process.env.DATABASE_URL) fail('Falta DATABASE_URL.')
  // Solo el servidor, nunca las credenciales: sirve para comprobar a qué base se está apuntando.
  const host = new URL(process.env.DATABASE_URL!).hostname
  console.log(`Base de datos: ${host}`)

  const payload = await getPayloadClient()
  const [categories, products] = await Promise.all([
    payload.find({ collection: 'categories', limit: 1000, depth: 0, pagination: false }),
    payload.find({ collection: 'products', limit: 5000, depth: 0, pagination: false }),
  ])
  const idBySlug = new Map(categories.docs.map((doc) => [doc.slug, doc.id]))
  const plan = planSeed(catalog, {
    categories: new Set(categories.docs.map((doc) => doc.slug)),
    products: new Set(products.docs.map((doc) => doc.slug)),
  })
  console.log(
    `Hoy hay ${categories.docs.length} categorías y ${products.docs.length} productos. ` +
      `Se crearían ${plan.categories.length} categorías y ${plan.products.length} productos.`,
  )

  if ((categories.docs.length || products.docs.length) && !args.has('--force'))
    fail('El catálogo no está vacío. Si igual querés agregar lo que falte, usá --force.')
  if (!args.has('--yes')) {
    console.log('No se escribió nada. Para cargarlos, repetí el comando agregando --yes.')
    process.exit(0)
  }

  let mediaId: number | undefined
  if (args.has('--with-media')) {
    const media = await payload.find({ collection: 'media', limit: 1, depth: 0 })
    mediaId = media.docs[0]?.id
    if (!mediaId) fail('--with-media necesita al menos una imagen en Media.')
  }

  // Fuera del servidor web, los avisos de caché y de Meilisearch de los hooks son esperables:
  // se cuentan y se resumen en vez de llenar la pantalla.
  const original = console.error
  let ignored = 0
  console.error = (...parts: unknown[]) => {
    const text = String(parts[0] ?? '')
    if (/No se pudo (sincronizar|revalidar)/.test(text)) ignored++
    else original(...parts)
  }
  try {
    for (const category of plan.categories) {
      const created = await payload.create({
        collection: 'categories',
        data: {
          name: category.name,
          slug: category.slug,
          parent: category.parent ? idBySlug.get(category.parent) : undefined,
        },
      })
      idBySlug.set(category.slug, created.id)
    }
    for (const product of plan.products) {
      await payload.create({
        collection: 'products',
        data: {
          name: product.name,
          slug: product.slug,
          sku: product.sku ?? undefined,
          description: product.description ?? undefined,
          brand: product.brand ?? undefined,
          category: idBySlug.get(product.category)!,
          price: product.price,
          compareAtPrice: product.compareAtPrice ?? undefined,
          stock: product.stock,
          status: product.status,
          images: mediaId ? [mediaId] : undefined,
        },
      })
    }
  } finally {
    console.error = original
  }

  console.log(`✓ Creadas ${plan.categories.length} categorías y ${plan.products.length} productos.`)
  if (ignored)
    console.log(
      `  (${ignored} avisos de caché o de Meilisearch ignorados: es normal fuera del servidor web.)`,
    )
  console.log('Siguientes pasos:')
  console.log(
    '  - Búsqueda: npm run meilisearch:sync (con las variables de Meilisearch del entorno).',
  )
  console.log(
    '  - La portada guarda el catálogo en caché hasta 5 minutos; si no aparece enseguida, esperá o recargá luego.',
  )
  process.exit(0)
}

main().catch((error) => {
  console.error('✗ Falló la carga:', error)
  process.exit(1)
})
