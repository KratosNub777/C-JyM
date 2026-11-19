import { describe, expect, it } from 'vitest'

import type { Product } from '@/payload-types'
import { canonicalPath, productJsonLd, serializeJsonLd, storeJsonLd } from '@/lib/structuredData'

const SITE = 'https://example.com.py'

const product = {
  id: 1,
  name: 'Heladera Tokyo 300 L',
  slug: 'heladera-tokyo-300',
  price: 3500000,
  stock: 0,
  sku: 'HT300',
  brand: 'Tokyo',
  description: 'Texto </script><script>alert(1)</script>',
  category: { id: 2, name: 'Heladeras', slug: 'heladeras' },
  images: [
    { id: 3, url: '/api/media/file/heladera.jpg', alt: null },
    { id: 4, url: 'https://cdn.example.com/heladera-2.jpg', alt: null },
    5,
  ],
} as unknown as Product

describe('structured data', () => {
  it('describes a product with price in Gs., availability and absolute images', () => {
    const data = productJsonLd(product, SITE)

    expect(data.url).toBe(`${SITE}/productos/heladera-tokyo-300`)
    expect(data.image).toEqual([
      `${SITE}/api/media/file/heladera.jpg`,
      'https://cdn.example.com/heladera-2.jpg',
    ])
    expect(data.brand).toEqual({ '@type': 'Brand', name: 'Tokyo' })
    expect(data.category).toBe('Heladeras')
    expect(data.offers).toMatchObject({
      price: 3500000,
      priceCurrency: 'PYG',
      availability: 'https://schema.org/OutOfStock',
    })
  })

  it('omits optional fields the product does not have', () => {
    const data = productJsonLd(
      { ...product, images: [], sku: null, brand: null, description: null, stock: 4 },
      SITE,
    )

    expect(data).not.toHaveProperty('image')
    expect(data).not.toHaveProperty('sku')
    expect(data).not.toHaveProperty('brand')
    expect(data.offers.availability).toBe('https://schema.org/InStock')
  })

  it('escapes < so admin text cannot close the script tag', () => {
    const json = serializeJsonLd(productJsonLd(product, SITE))

    expect(json).not.toContain('</script>')
    expect(JSON.parse(json).description).toBe(product.description)
  })

  it('describes the store with address and opening hours', () => {
    const data = storeJsonLd(SITE)

    expect(data.address.addressLocality).toBe('San Lorenzo')
    expect(data.openingHoursSpecification).toHaveLength(2)
  })

  it('keeps only the page in canonical paths', () => {
    expect(canonicalPath('/productos')).toBe('/productos')
    expect(canonicalPath('/productos', 1)).toBe('/productos')
    expect(canonicalPath('/productos', 3)).toBe('/productos?page=3')
    expect(canonicalPath('/productos', 1.5)).toBe('/productos')
  })
})
