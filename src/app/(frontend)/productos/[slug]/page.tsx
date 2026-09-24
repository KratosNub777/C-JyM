import { ImageSquare } from '@phosphor-icons/react/dist/ssr'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import type { Category, Media } from '@/payload-types'
import { formatGs } from '@/lib/format'
import { getPayloadClient } from '@/lib/payload'

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const payload = await getPayloadClient()

  const { docs } = await payload.find({
    collection: 'products',
    where: { slug: { equals: slug } },
    limit: 1,
  })

  const product = docs[0]

  if (!product) {
    notFound()
  }

  const category = typeof product.category === 'object' ? (product.category as Category) : null
  const images = (product.images ?? []).filter(
    (image): image is Media => typeof image === 'object',
  )

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

      <div>
        {category && (
          <Link
            href={`/categorias/${category.slug}`}
            className="text-sm font-medium text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200"
          >
            {category.name}
          </Link>
        )}
        <h1 className="mt-1 text-2xl font-bold text-neutral-900 dark:text-neutral-100">
          {product.name}
        </h1>
        {product.brand && (
          <p className="mt-1 text-neutral-500 dark:text-neutral-400">{product.brand}</p>
        )}
        <p className="mt-4 text-3xl font-bold text-neutral-900 dark:text-neutral-100">
          {formatGs(product.price)}
        </p>

        <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
          {product.stock > 0 ? `${product.stock} disponibles` : 'Sin stock'}
        </p>

        {product.description && (
          <div className="mt-6 whitespace-pre-line text-neutral-700 dark:text-neutral-300">
            {product.description}
          </div>
        )}
      </div>
    </div>
  )
}
