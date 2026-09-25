import { NextResponse } from 'next/server'

import { slugify } from '@/lib/slug'
import { getPayloadClient } from '@/lib/payload'

async function dedupeSlug(
  payload: Awaited<ReturnType<typeof getPayloadClient>>,
  collection: 'products' | 'categories',
  baseSlug: string,
) {
  let slug = baseSlug
  let suffix = 2

  while (true) {
    const { docs } = await payload.find({
      collection,
      where: { slug: { equals: slug } },
      limit: 1,
    })
    if (docs.length === 0) return slug
    slug = `${baseSlug}-${suffix}`
    suffix += 1
  }
}

export async function POST(request: Request) {
  const payload = await getPayloadClient()
  const { user } = await payload.auth({ headers: request.headers })

  if (!user) {
    return NextResponse.json({ ok: false, error: 'No autorizado.' }, { status: 401 })
  }

  const formData = await request.formData()

  const name = String(formData.get('name') ?? '').trim()
  const priceRaw = formData.get('price')
  const stockRaw = formData.get('stock')
  const compareAtPriceRaw = formData.get('compareAtPrice')
  const sku = String(formData.get('sku') ?? '').trim() || undefined
  const description = String(formData.get('description') ?? '').trim() || undefined
  const brand = String(formData.get('brand') ?? '').trim() || undefined
  const categoryId = formData.get('categoryId')
  const categoryName = formData.get('categoryName')
  const subcategoryId = formData.get('subcategoryId')
  const subcategoryName = formData.get('subcategoryName')
  const photo = formData.get('photo')

  const price = Number(priceRaw)
  const stock = Number(stockRaw)
  const compareAtPrice = compareAtPriceRaw ? Number(compareAtPriceRaw) : undefined

  if (!name) {
    return NextResponse.json({ ok: false, error: 'Falta el nombre.' }, { status: 400 })
  }
  if (!categoryId && !categoryName) {
    return NextResponse.json({ ok: false, error: 'Falta la categoría.' }, { status: 400 })
  }
  if (!priceRaw || Number.isNaN(price) || price < 0) {
    return NextResponse.json({ ok: false, error: 'Precio inválido.' }, { status: 400 })
  }
  if (!stockRaw || Number.isNaN(stock) || stock < 0) {
    return NextResponse.json({ ok: false, error: 'Stock inválido.' }, { status: 400 })
  }
  if (compareAtPriceRaw && (Number.isNaN(compareAtPrice) || (compareAtPrice as number) < 0)) {
    return NextResponse.json({ ok: false, error: 'Precio de lista inválido.' }, { status: 400 })
  }

  // Cosas que este request crea desde cero (no las que reutiliza por id) — si un paso
  // posterior falla, las borramos para no dejar categorías/fotos huérfanas sin producto.
  let createdCategoryId: number | undefined
  let createdSubcategoryId: number | undefined
  let createdMediaId: number | undefined

  async function cleanupCreated() {
    if (createdMediaId) {
      await payload.delete({ collection: 'media', id: createdMediaId }).catch(() => {})
    }
    if (createdSubcategoryId) {
      await payload.delete({ collection: 'categories', id: createdSubcategoryId }).catch(() => {})
    }
    if (createdCategoryId) {
      await payload.delete({ collection: 'categories', id: createdCategoryId }).catch(() => {})
    }
  }

  try {
    let category: { id: number; name: string }
    if (categoryId) {
      const doc = await payload.findByID({ collection: 'categories', id: Number(categoryId) })
      category = { id: doc.id, name: doc.name }
    } else {
      const created = await payload.create({
        collection: 'categories',
        data: {
          name: String(categoryName),
          slug: await dedupeSlug(payload, 'categories', slugify(String(categoryName))),
        },
      })
      category = { id: created.id, name: created.name }
      createdCategoryId = created.id
    }

    let subcategory: { id: number; name: string } | null = null
    if (subcategoryId) {
      const doc = await payload.findByID({ collection: 'categories', id: Number(subcategoryId) })
      subcategory = { id: doc.id, name: doc.name }
    } else if (subcategoryName) {
      const created = await payload.create({
        collection: 'categories',
        data: {
          name: String(subcategoryName),
          slug: await dedupeSlug(payload, 'categories', slugify(String(subcategoryName))),
          parent: category.id,
        },
      })
      subcategory = { id: created.id, name: created.name }
      createdSubcategoryId = created.id
    }

    let imageId: number | undefined
    if (photo instanceof File && photo.size > 0) {
      const arrayBuffer = await photo.arrayBuffer()
      const media = await payload.create({
        collection: 'media',
        data: { alt: name },
        file: {
          data: Buffer.from(arrayBuffer),
          mimetype: photo.type || 'application/octet-stream',
          name: photo.name || 'foto.jpg',
          size: photo.size,
        },
      })
      imageId = media.id
      createdMediaId = media.id
    }

    const slug = await dedupeSlug(payload, 'products', slugify(name))

    const product = await payload.create({
      collection: 'products',
      data: {
        name,
        slug,
        sku,
        description,
        brand,
        category: (subcategory ?? category).id,
        images: imageId ? [imageId] : undefined,
        price,
        compareAtPrice,
        stock,
        status: 'active',
      },
    })

    return NextResponse.json({
      ok: true,
      product: { id: product.id, name: product.name },
      category,
      subcategory,
    })
  } catch (error) {
    console.error('Error guardando producto desde /catalogar:', error)
    await cleanupCreated()
    return NextResponse.json(
      { ok: false, error: 'No se pudo guardar el producto. Probá de nuevo.' },
      { status: 500 },
    )
  }
}
