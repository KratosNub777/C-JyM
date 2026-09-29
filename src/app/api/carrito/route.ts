import { getPayloadClient } from '@/lib/payload'
import { isProductId, MAX_CART_ITEMS } from '@/lib/cart/model'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  const idsParam = new URL(request.url).searchParams.get('ids') ?? ''
  const values = idsParam.split(',')
  if (
    !idsParam ||
    idsParam.length > 2_000 ||
    values.length > MAX_CART_ITEMS ||
    values.some((value) => !/^\d+$/.test(value) || !isProductId(Number(value)))
  ) {
    return Response.json({ error: 'Lista de productos inválida.' }, { status: 400 })
  }
  const ids = [...new Set(values.map(Number))]
  try {
    const payload = await getPayloadClient()
    const { docs } = await payload.find({
      collection: 'products',
      where: { and: [{ id: { in: ids } }, { status: { equals: 'active' } }] },
      select: { name: true, slug: true, price: true, stock: true, images: true },
      depth: 1,
      limit: ids.length,
      overrideAccess: false,
    })
    const products = docs.map((product) => {
      const image = product.images?.find((item) => item && typeof item === 'object')
      return {
        id: product.id,
        name: product.name,
        slug: product.slug,
        price: product.price,
        stock: Math.max(0, Math.floor(product.stock)),
        image:
          image && typeof image === 'object' && image.url
            ? { url: image.url, alt: image.alt || product.name }
            : null,
      }
    })
    return Response.json({ products }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    console.error('No se pudieron consultar los productos del carrito:', error)
    return Response.json(
      { error: 'No se pudo consultar el carrito. Intentá de nuevo.' },
      { status: 503 },
    )
  }
}
