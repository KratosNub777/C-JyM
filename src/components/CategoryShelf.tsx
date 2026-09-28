import { GridFour } from '@phosphor-icons/react/dist/ssr'
import Image from 'next/image'
import Link from 'next/link'

import type { Category, Media, Product } from '@/payload-types'
import { ProductCarousel } from '@/components/ProductCarousel'
import { ICONS_BY_SLUG } from '@/lib/categories'

type SubcategoryLink = {
  id: number
  name: string
  slug: string
}

export function CategoryShelf({
  category,
  subcategories,
  products,
}: {
  category: Pick<Category, 'id' | 'name' | 'slug' | 'bannerImage' | 'bannerLink'>
  subcategories: SubcategoryLink[]
  products: Product[]
}) {
  const Icon = ICONS_BY_SLUG[category.slug] ?? GridFour
  const banner = typeof category.bannerImage === 'object' ? (category.bannerImage as Media) : null

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Icon size={20} weight="bold" className="text-brand-600" />
          <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
            {category.name}
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          {subcategories.map((sub) => (
            <Link
              key={sub.id}
              href={`/categorias/${sub.slug}`}
              className="text-sm text-neutral-500 transition-colors hover:text-brand-600 dark:text-neutral-400"
            >
              {sub.name}
            </Link>
          ))}
          <Link
            href={`/categorias/${category.slug}`}
            className="text-sm font-medium text-brand-600 transition-colors hover:text-brand-700"
          >
            Ver todo →
          </Link>
        </div>
      </div>

      {banner?.url && (
        <a
          href={category.bannerLink || `/categorias/${category.slug}`}
          className="block aspect-[21/9] w-full overflow-hidden rounded-2xl bg-neutral-100 dark:bg-neutral-800"
        >
          <Image
            src={banner.url}
            alt={banner.alt ?? category.name}
            width={1200}
            height={514}
            className="h-full w-full object-cover"
          />
        </a>
      )}

      <ProductCarousel products={products} />
    </section>
  )
}
