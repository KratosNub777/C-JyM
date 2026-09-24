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
      className="group flex flex-col overflow-hidden rounded-lg border border-neutral-200 bg-white transition hover:shadow-md"
    >
      <div className="relative aspect-square w-full bg-neutral-100">
        {image?.url ? (
          <Image
            src={image.url}
            alt={image.alt ?? product.name}
            fill
            className="object-cover transition group-hover:scale-105"
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-neutral-400">
            Sin imagen
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3">
        {product.brand && (
          <span className="text-xs font-medium uppercase tracking-wide text-neutral-500">
            {product.brand}
          </span>
        )}
        <h3 className="line-clamp-2 text-sm font-medium text-neutral-900">{product.name}</h3>
        <p className="mt-auto text-base font-semibold text-neutral-900">
          {formatUsd(product.priceUsd)}
        </p>
      </div>
    </Link>
  )
}
