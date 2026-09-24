import { ImageSquare } from '@phosphor-icons/react/dist/ssr'
import Image from 'next/image'
import Link from 'next/link'

import type { Media, Product } from '@/payload-types'

function formatUsd(value: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)
}

export function ProductCard({ product }: { product: Product }) {
  const firstImage = product.images?.[0]
  const image = typeof firstImage === 'object' ? (firstImage as Media) : null

  return (
    <Link
      href={`/productos/${product.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white transition hover:-translate-y-0.5 hover:shadow-lg dark:border-neutral-800 dark:bg-neutral-900"
    >
      <div className="relative aspect-square w-full bg-neutral-100 dark:bg-neutral-800">
        {image?.url ? (
          <Image
            src={image.url}
            alt={image.alt ?? product.name}
            fill
            className="object-cover transition duration-300 group-hover:scale-105"
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-1 text-neutral-300 dark:text-neutral-600">
            <ImageSquare size={28} weight="light" />
            <span className="text-xs text-neutral-400 dark:text-neutral-500">Sin imagen</span>
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3">
        {product.brand && (
          <span className="text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
            {product.brand}
          </span>
        )}
        <h3 className="line-clamp-2 text-sm font-medium text-neutral-900 dark:text-neutral-100">
          {product.name}
        </h3>
        <p className="mt-auto text-base font-semibold text-neutral-900 dark:text-neutral-100">
          {formatUsd(product.priceUsd)}
        </p>
      </div>
    </Link>
  )
}
