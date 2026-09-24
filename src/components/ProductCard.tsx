import { ImageSquare, ShoppingCart } from '@phosphor-icons/react/dist/ssr'
import Image from 'next/image'
import Link from 'next/link'

import type { Media, Product } from '@/payload-types'
import { formatGs } from '@/lib/format'
import { getInstallmentOptions } from '@/lib/pricing'

export function ProductCard({ product }: { product: Product }) {
  const firstImage = product.images?.[0]
  const image = typeof firstImage === 'object' ? (firstImage as Media) : null

  const hasDiscount = !!product.compareAtPrice && product.compareAtPrice > product.price
  const discountPercent = hasDiscount
    ? Math.round(100 - (product.price / product.compareAtPrice!) * 100)
    : null

  const [featuredInstallment] = getInstallmentOptions(product.price, product.compareAtPrice).slice(
    -1,
  )

  const inStock = product.stock > 0

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
        {discountPercent && (
          <span className="absolute left-2 top-2 rounded-full bg-brand-green-600 px-2 py-0.5 text-xs font-semibold text-white">
            -{discountPercent}%
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1.5 p-3">
        <div className="flex items-center justify-between gap-2">
          {product.brand && (
            <span className="text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
              {product.brand}
            </span>
          )}
          <span
            className={
              inStock
                ? 'text-xs font-medium text-brand-green-600 dark:text-brand-green-100'
                : 'text-xs font-medium text-neutral-400 dark:text-neutral-500'
            }
          >
            {inStock ? 'En stock' : 'Sin stock'}
          </span>
        </div>

        <h3 className="line-clamp-2 text-sm font-medium text-neutral-900 dark:text-neutral-100">
          {product.name}
        </h3>

        <div className="mt-auto flex items-end justify-between gap-2 pt-1">
          <div>
            {hasDiscount && (
              <p className="text-xs text-neutral-400 line-through dark:text-neutral-500">
                {formatGs(product.compareAtPrice!)}
              </p>
            )}
            <p className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
              {formatGs(product.price)}
            </p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              o {featuredInstallment.count}x {formatGs(featuredInstallment.perInstallment)}
            </p>
          </div>

          <span
            aria-hidden="true"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-600 text-white transition group-hover:bg-brand-700"
          >
            <ShoppingCart size={16} weight="bold" />
          </span>
        </div>
      </div>
    </Link>
  )
}
