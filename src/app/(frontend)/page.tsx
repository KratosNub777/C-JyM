import { CategoryBentoGrid } from '@/components/CategoryBentoGrid'
import { CategoryShelf } from '@/components/CategoryShelf'
import { Hero } from '@/components/Hero'
import { ValuePropStrip } from '@/components/ValuePropStrip'
import { buildCategoryTree, getParentId } from '@/lib/categories'
import { getCachedHomeData } from '@/lib/categoryQueries'
import type { Product } from '@/payload-types'

// Debe ser un literal estático (analizable en build time) — no se puede
// importar CATALOG_REVALIDATE_SECONDS acá; mantener en sync manualmente.
export const revalidate = 300

const SHELF_PRODUCT_LIMIT = 12

export default async function HomePage() {
  const { subcategories, allCategories, activeProducts, productCounts } = await getCachedHomeData()

  // 9 tarjetas llenan la grilla de 3 columnas sin huecos (la primera ocupa 2x2).
  const categoriesWithCount = subcategories
    .map((category) => ({
      id: category.id,
      name: category.name,
      slug: category.slug,
      productCount: productCounts[category.id] ?? 0,
    }))
    .filter((category) => category.productCount > 0)
    .sort((a, b) => b.productCount - a.productCount || a.name.localeCompare(b.name, 'es'))
    .slice(0, 9)

  const { topLevel, childrenByParent } = buildCategoryTree(allCategories)

  const categoryIdToTopLevelId = allCategories.reduce<Record<number, number>>((map, category) => {
    map[category.id] = getParentId(category) ?? category.id
    return map
  }, {})

  const productsByTopLevelId = activeProducts.reduce<Record<number, Product[]>>(
    (groups, product) => {
      const categoryId =
        typeof product.category === 'object' ? product.category.id : product.category
      const topLevelId = categoryIdToTopLevelId[categoryId]
      if (!topLevelId) return groups
      groups[topLevelId] = groups[topLevelId] ?? []
      groups[topLevelId].push(product)
      return groups
    },
    {},
  )

  const shelves = topLevel
    .map((category) => ({
      category,
      subcategories: (childrenByParent[category.id] ?? []).map((sub) => ({
        id: sub.id,
        name: sub.name,
        slug: sub.slug,
      })),
      products: (productsByTopLevelId[category.id] ?? []).slice(0, SHELF_PRODUCT_LIMIT),
    }))
    .filter((shelf) => shelf.products.length > 0)

  return (
    <div className="flex flex-col gap-16">
      <Hero />

      {categoriesWithCount.length > 0 && (
        <section className="flex flex-col gap-4">
          <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
            Comprá por categoría
          </h2>
          <CategoryBentoGrid categories={categoriesWithCount} />
        </section>
      )}

      <ValuePropStrip />

      {shelves.length === 0 ? (
        <p className="text-neutral-500 dark:text-neutral-400">
          Estamos actualizando el catálogo. Volvé en unos minutos o escribinos por WhatsApp.
        </p>
      ) : (
        shelves.map((shelf) => (
          <CategoryShelf
            key={shelf.category.id}
            category={shelf.category}
            subcategories={shelf.subcategories}
            products={shelf.products}
          />
        ))
      )}
    </div>
  )
}
