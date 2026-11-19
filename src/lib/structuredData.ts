import type { Category, Media, Product } from '@/payload-types'
import { BUSINESS_EMAIL, BUSINESS_NAME, BUSINESS_PHONE, INSTAGRAM_URL } from '@/lib/contact'

// Datos estructurados (schema.org) para que Google muestre precio, stock y datos del local.
// Se validan con https://search.google.com/test/rich-results una vez publicado el dominio.

export function productJsonLd(product: Product, siteUrl: string) {
  const url = `${siteUrl}/productos/${product.slug}`
  const images = (product.images ?? [])
    .filter((image): image is Media => typeof image === 'object' && !!image.url)
    // La URL puede ser relativa (/api/media/...) o absoluta (R2): se resuelve contra el sitio.
    .map((image) => new URL(image.url!, siteUrl).toString())
  const category = typeof product.category === 'object' ? (product.category as Category) : null

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    url,
    ...(images.length > 0 && { image: images }),
    ...(product.description && { description: product.description }),
    ...(product.sku && { sku: product.sku }),
    ...(product.brand && { brand: { '@type': 'Brand', name: product.brand } }),
    ...(category && { category: category.name }),
    offers: {
      '@type': 'Offer',
      url,
      price: product.price,
      priceCurrency: 'PYG',
      availability:
        product.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      itemCondition: 'https://schema.org/NewCondition',
      seller: { '@type': 'Organization', name: BUSINESS_NAME },
    },
  }
}

export function storeJsonLd(siteUrl: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ElectronicsStore',
    name: BUSINESS_NAME,
    url: siteUrl,
    logo: `${siteUrl}/logo.png`,
    image: `${siteUrl}/logo.png`,
    telephone: BUSINESS_PHONE,
    email: BUSINESS_EMAIL,
    currenciesAccepted: 'PYG',
    // Mismos datos que BUSINESS_ADDRESS (plus code JFV5+W98), separados como pide schema.org.
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'San Lorenzo',
      postalCode: '111444',
      addressCountry: 'PY',
    },
    // Mismo horario que BUSINESS_HOURS.
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        opens: '07:30',
        closes: '18:30',
      },
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: 'Saturday',
        opens: '07:30',
        closes: '16:00',
      },
    ],
    sameAs: [INSTAGRAM_URL],
  }
}

// `<` escapado para que un texto cargado en el admin no pueda cerrar el <script>.
export function serializeJsonLd(data: object) {
  return JSON.stringify(data).replace(/</g, '\\u003c')
}

// Las variantes con filtros u orden apuntan a la URL limpia; la paginación conserva su página.
export function canonicalPath(path: string, page = 1) {
  return Number.isInteger(page) && page > 1 ? `${path}?page=${page}` : path
}
