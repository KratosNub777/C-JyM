import Link from 'next/link'
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

export default async function HomePage() {
  const { subcategories, allCategories, activeProducts } = await getCachedHomeData()

  const countsByCategory = activeProducts.reduce<Record<number, number>>((counts, product) => {
    const categoryId = typeof product.category === 'object' ? product.category.id : product.category
    counts[categoryId] = (counts[categoryId] ?? 0) + 1
    return counts
  }, {})

  const categoriesWithCount = subcategories
    .map((category) => ({
      id: category.id,
      name: category.name,
      slug: category.slug,
      productCount: countsByCategory[category.id] ?? 0,
    }))
    .sort((a, b) => b.productCount - a.productCount)

  const { topLevel, childrenByParent } = buildCategoryTree(allCategories)

  const categoryIdToTopLevelId = allCategories.reduce<Record<number, number>>((map, category) => {
    map[category.id] = getParentId(category) ?? category.id
    return map
  }, {})

  const productsByTopLevelId = activeProducts.reduce<Record<number, Product[]>>(
    (groups, product) => {
      const categoryId = typeof product.category === 'object' ? product.category.id : product.category
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
      products: productsByTopLevelId[category.id] ?? [],
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
          Todavía no hay productos cargados. Agregalos desde el{' '}
          <Link href="/admin" className="underline">
            panel de administración
          </Link>
          .
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
