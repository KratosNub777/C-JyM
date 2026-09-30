import { describe, expect, it } from 'vitest'

import { findStaleIds } from '@/lib/meilisearch'

describe('findStaleIds', () => {
  it('returns indexed documents without an active product', () => {
    expect(findStaleIds([1, 2, 3, 4], [2, 4, 9])).toEqual([1, 3])
  })

  it('returns nothing when the index matches the active products', () => {
    expect(findStaleIds([5, 6], new Set([6, 5]))).toEqual([])
  })

  it('removes everything when no product is active', () => {
    expect(findStaleIds([1, 2], [])).toEqual([1, 2])
  })

  it('handles an empty index', () => {
    expect(findStaleIds([], [1, 2])).toEqual([])
  })
})
