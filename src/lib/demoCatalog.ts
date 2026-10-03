export type DemoCategory = { name: string; slug: string; parent: string | null }

export type DemoProduct = {
  name: string
  slug: string
  sku: string | null
  description: string | null
  brand: string | null
  category: string
  price: number
  compareAtPrice: number | null
  stock: number
  status: 'active' | 'inactive'
}

export type DemoCatalog = { categories: DemoCategory[]; products: DemoProduct[] }

const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/

// Revisa el archivo de datos antes de escribir nada en la base: devuelve los problemas encontrados.
export function validateDemoCatalog(data: DemoCatalog): string[] {
  const problems: string[] = []
  const categories = new Map(data.categories.map((category) => [category.slug, category]))
  if (categories.size !== data.categories.length) problems.push('Hay categorías con el mismo slug.')
  for (const category of data.categories) {
    if (!SLUG.test(category.slug)) problems.push(`Slug de categoría inválido: ${category.slug}`)
    if (category.parent) {
      const parent = categories.get(category.parent)
      if (!parent) problems.push(`La categoría ${category.slug} tiene un padre inexistente.`)
      else if (parent.parent)
        problems.push(`${category.slug}: solo se admite un nivel de subcategorías.`)
    }
  }
  const slugs = new Set<string>()
  for (const product of data.products) {
    if (slugs.has(product.slug)) problems.push(`Producto repetido: ${product.slug}`)
    slugs.add(product.slug)
    if (!SLUG.test(product.slug)) problems.push(`Slug de producto inválido: ${product.slug}`)
    if (!categories.has(product.category))
      problems.push(`${product.slug}: la categoría ${product.category} no existe.`)
    if (!Number.isInteger(product.price) || product.price < 0)
      problems.push(`${product.slug}: el precio debe ser un entero en guaraníes.`)
    if (product.compareAtPrice !== null && !(product.compareAtPrice > product.price))
      problems.push(`${product.slug}: el precio anterior debe ser mayor que el precio.`)
    if (!Number.isInteger(product.stock) || product.stock < 0)
      problems.push(`${product.slug}: el stock debe ser un entero no negativo.`)
  }
  return problems
}

// Qué crear según lo que ya existe en la base (por slug): las categorías principales van primero,
// porque las subcategorías necesitan el id de su padre.
export function planSeed(
  data: DemoCatalog,
  existing: { categories: ReadonlySet<string>; products: ReadonlySet<string> },
) {
  const categories = [
    ...data.categories.filter((category) => !category.parent),
    ...data.categories.filter((category) => category.parent),
  ].filter((category) => !existing.categories.has(category.slug))
  const products = data.products.filter((product) => !existing.products.has(product.slug))
  return { categories, products }
}
