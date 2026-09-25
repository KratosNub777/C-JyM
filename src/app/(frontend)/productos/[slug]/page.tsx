import { ImageSquare, ShoppingCart } from '@phosphor-icons/react/dist/ssr'
import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { InstallmentBreakdown } from '@/components/InstallmentBreakdown'
import type { Category, Media } from '@/payload-types'
import { formatGs } from '@/lib/format'
import { getProductBySlug } from '@/lib/products'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const product = await getProductBySlug(slug)

  if (!product) {
    return { title: 'Producto no encontrado' }
  }

  const image = product.images?.find((img): img is Media => typeof img === 'object')
  const description = product.description?.slice(0, 160) || `${product.name} en Comercial José María.`

  return {
    title: product.name,
    description,
    openGraph: {
      title: product.name,
      description,
      type: 'website',
      images: image?.url ? [{ url: image.url, alt: image.alt ?? product.name }] : undefined,
    },
  }
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const product = await getProductBySlug(slug)

  if (!product) {
    notFound()
  }

  const category = typeof product.category === 'object' ? (product.category as Category) : null
  const images = (product.images ?? []).filter(
    (image): image is Media => typeof image === 'object',
  )

  const hasDiscount = !!product.compareAtPrice && product.compareAtPrice > product.price
  const inStock = product.stock > 0

  return (
    <div className="grid gap-8 md:grid-cols-2">
      <div className="flex flex-col gap-3">
        <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-neutral-100 dark:bg-neutral-800">
          {images[0]?.url ? (
            <Image
              src={images[0].url}
              alt={images[0].alt ?? product.name}
              fill
              className="object-cover"
              sizes="(min-width: 768px) 50vw, 100vw"
              priority
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-1 text-neutral-300 dark:text-neutral-600">
              <ImageSquare size={36} weight="light" />
              <span className="text-xs text-neutral-400 dark:text-neutral-500">Sin imagen</span>
            </div>
          )}
        </div>
        {images.length > 1 && (
          <div className="grid grid-cols-4 gap-2">
            {images.slice(1).map((image) => (
              <div
                key={image.id}
                className="relative aspect-square overflow-hidden rounded-2xl bg-neutral-100 dark:bg-neutral-800"
              >
                <Image
                  src={image.url ?? ''}
                  alt={image.alt ?? product.name}
                  fill
                  className="object-cover"
                  sizes="25vw"
                />
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-4">
        <div>
          <div className="flex items-center justify-between gap-2">
            {category && (
              <Link
                href={`/categorias/${category.slug}`}
                className="text-sm font-medium text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200"
              >
                {category.name}
              </Link>
            )}
            <span
              className={
                inStock
                  ? 'text-sm font-medium text-brand-green-600 dark:text-brand-green-100'
                  : 'text-sm font-medium text-neutral-400 dark:text-neutral-500'
              }
            >
              {inStock ? 'En stock' : 'Sin stock'}
            </span>
          </div>

          <h1 className="mt-1 text-2xl font-bold text-neutral-900 dark:text-neutral-100">
            {product.name}
          </h1>

          <div className="mt-1 flex items-center gap-3 text-sm text-neutral-500 dark:text-neutral-400">
            {product.brand && <span>{product.brand}</span>}
            {product.sku && <span>COD: {product.sku}</span>}
          </div>
        </div>

        <div>
          {hasDiscount && (
            <p className="text-base text-neutral-400 line-through dark:text-neutral-500">
              {formatGs(product.compareAtPrice!)}
            </p>
          )}
          <p className="text-sm font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
            Precio contado
          </p>
          <p className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">
            {formatGs(product.price)}
          </p>
        </div>

        <InstallmentBreakdown price={product.price} compareAtPrice={product.compareAtPrice} />

        <button
          type="button"
          disabled
          className="flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-full bg-brand-600 px-5 py-3 text-sm font-semibold text-white opacity-50"
        >
          <ShoppingCart size={18} weight="bold" />
          Agregar al carrito (próximamente)
        </button>

        {product.description && (
          <div className="whitespace-pre-line text-neutral-700 dark:text-neutral-300">
            {product.description}
          </div>
        )}
      </div>
    </div>
  )
}
