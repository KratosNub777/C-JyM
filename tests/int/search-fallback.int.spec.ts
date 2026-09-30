import { describe, expect, it } from 'vitest'

import { fallbackSearchWhere } from '@/lib/searchFallback'

const termClause = (term: string) => ({
  or: [{ name: { contains: term } }, { brand: { contains: term } }, { sku: { contains: term } }],
})

describe('fallbackSearchWhere', () => {
  it('only searches active products and requires every word', () => {
    expect(fallbackSearchWhere('heladera  philco')).toEqual({
      and: [{ status: { equals: 'active' } }, termClause('heladera'), termClause('philco')],
    })
  })

  it('limits the number and length of the search terms', () => {
    const where = fallbackSearchWhere(`${'a'.repeat(80)} b c d e f g`)
    const clauses = (where as { and: unknown[] }).and
    expect(clauses).toHaveLength(1 + 5)
    expect(clauses[1]).toEqual(termClause('a'.repeat(50)))
  })

  it('only keeps the active filter for a blank query', () => {
    expect(fallbackSearchWhere('   ')).toEqual({ and: [{ status: { equals: 'active' } }] })
  })
})
