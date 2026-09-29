// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { MAX_CART_ITEMS, MAX_CART_QUANTITY, parseStoredCart } from '@/lib/cart/model'

describe('Untrusted cart storage', () => {
  it('recovers from malformed storage and unknown versions', () => {
    for (const raw of [
      null,
      '{broken',
      'null',
      '[]',
      '{"version":2,"items":[]}',
      '{"version":1,"items":{}}',
    ])
      expect(parseStoredCart(raw)).toEqual([])
  })
  it('ignores prices and other supplied product data', () => {
    expect(
      parseStoredCart(
        JSON.stringify({
          version: 1,
          items: [{ productId: 1, quantity: 2, price: 0, name: '<script>' }],
        }),
      ),
    ).toEqual([{ productId: 1, quantity: 2 }])
  })
  it('rejects negative, fractional and coerced IDs or quantities', () => {
    const items = [
      { productId: -1, quantity: 1 },
      { productId: '1', quantity: 1 },
      { productId: 1.5, quantity: 1 },
      { productId: Number.MAX_SAFE_INTEGER, quantity: 1 },
      { productId: 2, quantity: 0 },
      { productId: 3, quantity: 1.5 },
      { productId: 4, quantity: '2' },
      null,
    ]
    expect(parseStoredCart(JSON.stringify({ version: 1, items }))).toEqual([])
  })
  it('combines duplicate products without exceeding the quantity limit', () => {
    expect(
      parseStoredCart(
        JSON.stringify({
          version: 1,
          items: [
            { productId: 1, quantity: 900 },
            { productId: 1, quantity: 900 },
          ],
        }),
      ),
    ).toEqual([{ productId: 1, quantity: MAX_CART_QUANTITY }])
  })
  it('bounds storage size and distinct products', () => {
    expect(parseStoredCart('x'.repeat(32_001))).toEqual([])
    const items = Array.from({ length: MAX_CART_ITEMS + 5 }, (_, index) => ({
      productId: index + 1,
      quantity: 1,
    }))
    expect(parseStoredCart(JSON.stringify({ version: 1, items }))).toHaveLength(MAX_CART_ITEMS)
  })
})
