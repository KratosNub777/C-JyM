import { describe, expect, it } from 'vitest'

import demo from '../../scripts/data/demo-catalog.json'
import { planSeed, validateDemoCatalog, type DemoCatalog } from '@/lib/demoCatalog'

const catalog = demo as unknown as DemoCatalog

describe('the bundled demo catalog', () => {
  it('is valid: unique slugs, existing categories and whole guarani prices', () => {
    expect(validateDemoCatalog(catalog)).toEqual([])
  })

  it('has top level categories, subcategories and products to fill the home page', () => {
    expect(catalog.categories.filter((category) => !category.parent).length).toBeGreaterThanOrEqual(
      3,
    )
    expect(catalog.categories.filter((category) => category.parent).length).toBeGreaterThanOrEqual(
      6,
    )
    expect(catalog.products.length).toBeGreaterThanOrEqual(12)
    expect(catalog.products.some((product) => product.compareAtPrice !== null)).toBe(true)
    expect(catalog.products.every((product) => product.status === 'active')).toBe(true)
  })
})

describe('validateDemoCatalog', () => {
  const base: DemoCatalog = {
    categories: [
      { name: 'Línea Blanca', slug: 'linea-blanca', parent: null },
      { name: 'Heladeras', slug: 'heladeras', parent: 'linea-blanca' },
    ],
    products: [
      {
        name: 'Heladera',
        slug: 'heladera',
        sku: null,
        description: null,
        brand: null,
        category: 'heladeras',
        price: 1000000,
        compareAtPrice: null,
        stock: 3,
        status: 'active',
      },
    ],
  }

  it('accepts a consistent catalog', () => {
    expect(validateDemoCatalog(base)).toEqual([])
  })

  it('reports duplicated slugs, missing categories and wrong prices', () => {
    const broken: DemoCatalog = {
      categories: [...base.categories, { name: 'Otra', slug: 'heladeras', parent: null }],
      products: [
        { ...base.products[0], category: 'no-existe' },
        { ...base.products[0], price: 10.5, stock: -1, compareAtPrice: 5 },
      ],
    }
    const problems = validateDemoCatalog(broken).join(' | ')
    expect(problems).toMatch(/mismo slug/)
    expect(problems).toMatch(/Producto repetido/)
    expect(problems).toMatch(/no existe/)
    expect(problems).toMatch(/entero en guaraníes/)
    expect(problems).toMatch(/stock/)
    expect(problems).toMatch(/precio anterior/)
  })

  it('only allows one level of subcategories and real parents', () => {
    const deep: DemoCatalog = {
      categories: [...base.categories, { name: 'Nieta', slug: 'nieta', parent: 'heladeras' }],
      products: [],
    }
    expect(validateDemoCatalog(deep).join(' ')).toMatch(/un nivel/)
    expect(
      validateDemoCatalog({
        categories: [{ name: 'X', slug: 'x', parent: 'nadie' }],
        products: [],
      }).join(' '),
    ).toMatch(/padre inexistente/)
  })
})

describe('planSeed', () => {
  it('creates parents before children', () => {
    const shuffled: DemoCatalog = {
      ...demo,
      categories: [...catalog.categories].reverse(),
      products: [],
    } as DemoCatalog
    const { categories } = planSeed(shuffled, { categories: new Set(), products: new Set() })
    const firstChild = categories.findIndex((category) => category.parent)
    expect(categories.slice(0, firstChild).every((category) => !category.parent)).toBe(true)
    expect(categories.slice(firstChild).every((category) => category.parent)).toBe(true)
  })

  it('skips what already exists so a second run does not duplicate anything', () => {
    const plan = planSeed(catalog, {
      categories: new Set(catalog.categories.map((category) => category.slug)),
      products: new Set(catalog.products.slice(0, 5).map((product) => product.slug)),
    })
    expect(plan.categories).toEqual([])
    expect(plan.products).toHaveLength(catalog.products.length - 5)
  })
})
