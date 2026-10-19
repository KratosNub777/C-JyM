import Image from 'next/image'
import Link from 'next/link'

import type { Media, Product } from '@/payload-types'
import { ProductImagePlaceholder } from '@/components/ProductImagePlaceholder'
import { formatGs } from '@/lib/format'
import { getInstallmentOptions } from '@/lib/pricing'
import { AddToCartButton } from '@/components/cart/AddToCartButton'

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
    <article className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white transition hover:-translate-y-0.5 hover:shadow-lg dark:border-neutral-800 dark:bg-neutral-900">
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
          <ProductImagePlaceholder />
        )}
        {discountPercent && (
          <span className="absolute left-2 top-2 rounded-full bg-accent-oferta-600 px-2 py-0.5 text-xs font-semibold text-white">
            -{discountPercent}%
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1.5 p-3">
        <div className="flex items-center justify-between gap-2">
          {product.brand && (
            <span className="text-[13px] font-medium uppercase tracking-wide text-neutral-600 dark:text-neutral-300">
              {product.brand}
            </span>
          )}
          <span
            className={
              inStock
                ? 'text-[13px] font-medium text-accent-ahorro-600 dark:text-accent-ahorro-100'
                : 'text-[13px] font-medium text-neutral-600 dark:text-neutral-400'
            }
          >
            {inStock ? 'En stock' : 'Sin stock'}
          </span>
        </div>

        <h3 className="line-clamp-2 text-sm font-medium text-neutral-900 dark:text-neutral-100">
          <Link
            href={`/productos/${product.slug}`}
            className="after:absolute after:inset-0 after:content-[''] focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-inset focus-visible:after:ring-brand-600"
          >
            {product.name}
          </Link>
        </h3>

        <div className="mt-auto pt-1">
          {hasDiscount && (
            <p className="text-sm text-neutral-500 line-through dark:text-neutral-400">
              {formatGs(product.compareAtPrice!)}
            </p>
          )}
          <div className="flex items-center justify-between gap-2">
            <p className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
              {formatGs(product.price)}
            </p>

            <div className="relative z-10">
              <AddToCartButton
                productId={product.id}
                name={product.name}
                stock={product.stock}
                active={product.status === 'active'}
                compact
              />
            </div>
          </div>
          <p className="text-[13px] font-medium text-neutral-600 dark:text-neutral-300">
            o {featuredInstallment.count}x {formatGs(featuredInstallment.perInstallment)}
          </p>
        </div>
      </div>
    </article>
  )
}
