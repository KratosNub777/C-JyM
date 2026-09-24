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
      limit: 6,
      sort: 'name',
    }),
  ])

  const categoriesWithCount = (
    await Promise.all(
      categories.map(async (category) => {
        const { totalDocs } = await payload.count({
          collection: 'products',
          where: { category: { equals: category.id }, status: { equals: 'active' } },
        })
        return {
          id: category.id,
          name: category.name,
          slug: category.slug,
          productCount: totalDocs,
        }
      }),
    )
  ).sort((a, b) => b.productCount - a.productCount)

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
