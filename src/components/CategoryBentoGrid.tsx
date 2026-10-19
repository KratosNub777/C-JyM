import Image from 'next/image'
import Link from 'next/link'

// Fotos de public/images/categorias/<slug>.jpg (Unsplash, licencia libre).
// Las categorías sin foto propia usan la de la portada.
const CATEGORY_IMAGE_SLUGS = new Set([
  'audio',
  'calefaccion',
  'climatizacion',
  'cocinas',
  'cuidado-personal',
  'freezers',
  'heladeras',
  'lavado',
  'limpieza',
  'microondas-hornos',
  'television',
])

function categoryImageSrc(slug: string) {
  return CATEGORY_IMAGE_SLUGS.has(slug) ? `/images/categorias/${slug}.jpg` : '/images/hero.jpg'
}

type CategoryTileData = {
  id: number
  name: string
  slug: string
  productCount: number
}

export function CategoryBentoGrid({ categories }: { categories: CategoryTileData[] }) {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:[grid-auto-flow:dense] md:auto-rows-[170px]">
      {categories.map((category, index) => (
        <Link
          key={category.id}
          href={`/categorias/${category.slug}`}
          className={`group relative overflow-hidden rounded-2xl bg-neutral-200 dark:bg-neutral-800 ${
            index === 0
              ? 'aspect-square md:aspect-auto md:col-span-2 md:row-span-2'
              : 'aspect-square md:aspect-auto'
          }`}
        >
          <Image
            src={categoryImageSrc(category.slug)}
            alt=""
            fill
            className="object-cover transition duration-300 group-hover:scale-105"
            sizes="(min-width: 768px) 33vw, 50vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-4">
            <p className="font-semibold text-white">{category.name}</p>
            <p className="text-sm text-white/75">
              {category.productCount} {category.productCount === 1 ? 'producto' : 'productos'}
            </p>
          </div>
        </Link>
      ))}
    </div>
  )
}
