import Link from 'next/link'

import { CategoryBentoGrid } from '@/components/CategoryBentoGrid'
import { Hero } from '@/components/Hero'
import { ProductCard } from '@/components/ProductCard'
import { ValuePropStrip } from '@/components/ValuePropStrip'
import { getPayloadClient } from '@/lib/payload'

export default async function HomePage() {
  const payload = await getPayloadClient()

  const [{ docs: featuredProducts }, { docs: categories }] = await Promise.all([
    payload.find({
      collection: 'products',
      where: { status: { equals: 'active' } },
      limit: 8,
      sort: '-createdAt',
    }),
    payload.find({
      collection: 'categories',
      limit: 9,
      sort: 'name',
    }),
  ])

  const { docs: activeProductCategories } = await payload.find({
    collection: 'products',
    where: { status: { equals: 'active' } },
    limit: 2000,
    depth: 0,
    select: { category: true },
  })

  const countsByCategory = activeProductCategories.reduce<Record<number, number>>(
    (counts, product) => {
      const categoryId = product.category as number
      counts[categoryId] = (counts[categoryId] ?? 0) + 1
      return counts
    },
    {},
  )

  const categoriesWithCount = categories
    .map((category) => ({
      id: category.id,
      name: category.name,
      slug: category.slug,
      productCount: countsByCategory[category.id] ?? 0,
    }))
    .sort((a, b) => b.productCount - a.productCount)

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

      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
            Novedades
          </h2>
          <Link
            href="/productos"
            className="text-sm font-medium text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
          >
            Ver todo →
          </Link>
        </div>
        {featuredProducts.length === 0 ? (
          <p className="text-neutral-500 dark:text-neutral-400">
            Todavía no hay productos cargados. Agregalos desde el{' '}
            <a href="/admin" className="underline">
              panel de administración
            </a>
            .
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {featuredProducts.map((product, index) => (
              <div
                key={product.id}
                className="animate-fade-up"
                style={{ animationDelay: `${index * 60}ms` }}
              >
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
