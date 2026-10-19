import { describe, expect, it } from 'vitest'

import { countActiveFilters, parseProductFilters } from '@/lib/productFilters'

describe('countActiveFilters', () => {
  it('is zero without filters', () => {
    expect(countActiveFilters(parseProductFilters({}))).toBe(0)
  })

  it('counts sort, each brand, the price range once and sale', () => {
    const filters = parseProductFilters({
      sort: 'price-asc',
      brand: ['Tokyo', 'Jam'],
      min: '1000',
      max: '5000',
      sale: '1',
    })
    expect(countActiveFilters(filters)).toBe(5)
  })

  it('ignores invalid values', () => {
    const filters = parseProductFilters({ sort: 'nope', min: 'abc', sale: '0' })
    expect(countActiveFilters(filters)).toBe(0)
  })
})
