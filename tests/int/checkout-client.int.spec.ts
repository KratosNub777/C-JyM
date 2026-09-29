import { randomUUID } from 'node:crypto'
import { act, createElement } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { CART_STORAGE_KEY } from '@/lib/cart/model'
import { addToCart, clearCart, consumeCartItems } from '@/lib/cart/store'
import { saveCheckoutAttempt, useCheckoutAttempt } from '@/lib/checkout/attempt'
import type { CheckoutInput } from '@/lib/checkout/model'

afterEach(() => {
  vi.restoreAllMocks()
  clearCart()
  sessionStorage.clear()
  vi.unstubAllGlobals()
})

describe('Checkout client recovery', () => {
  it('removes purchased quantities while keeping additions made during checkout', () => {
    clearCart()
    addToCart(1, 10)
    addToCart(1, 10)
    addToCart(2, 10)
    consumeCartItems([{ productId: 1, quantity: 1 }])
    expect(JSON.parse(localStorage.getItem(CART_STORAGE_KEY)!).items).toEqual([
      { productId: 1, quantity: 1 },
      { productId: 2, quantity: 1 },
    ])
  })

  it('retains a retry in memory when storage reads work but writes are blocked', () => {
    const customerId = `blocked-${randomUUID()}`
    const request = {
      requestId: randomUUID(),
      customerName: 'Cliente',
      phone: '0981123456',
      notes: '',
      items: [{ productId: 1, quantity: 1, expectedPrice: 25000 }],
    }
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('Quota exceeded', 'QuotaExceededError')
    })
    vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
    const result: { current: CheckoutInput | null } = { current: null }
    function Fixture() {
      result.current = useCheckoutAttempt(customerId)
      return null
    }
    const container = document.createElement('div')
    const root = createRoot(container)
    act(() => root.render(createElement(Fixture)))
    act(() => saveCheckoutAttempt(customerId, request))
    expect(result.current).toEqual(request)
    act(() => saveCheckoutAttempt(customerId, null))
    expect(result.current).toBeNull()
    act(() => root.unmount())
  })
})
