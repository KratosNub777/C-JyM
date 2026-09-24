import Image from 'next/image'
import Link from 'next/link'

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
            index === 0 ? 'aspect-square md:aspect-auto md:col-span-2 md:row-span-2' : 'aspect-square md:aspect-auto'
          }`}
        >
          <Image
            src={`https://picsum.photos/seed/cjym-${category.slug}/800/800`}
            alt=""
            fill
            className="object-cover transition duration-300 group-hover:scale-105"
            sizes="(min-width: 768px) 33vw, 50vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-4">
            <p className="font-semibold text-white">{category.name}</p>
            <p className="text-sm text-white/75">{category.productCount} productos</p>
          </div>
        </Link>
      ))}
    </div>
  )
}
