import { describe, expect, it } from 'vitest'

import { formatGs } from '@/lib/format'
import { cartOrderText, productInquiryText, whatsappUrl } from '@/lib/whatsapp'

describe('whatsappUrl', () => {
  it('points to the company number', () => {
    expect(whatsappUrl()).toBe('https://wa.me/595981339654')
  })

  it('encodes the prefilled text', () => {
    const url = new URL(whatsappUrl('Hola & chau\n2 × Gs. 100'))
    expect(url.searchParams.get('text')).toBe('Hola & chau\n2 × Gs. 100')
  })
})

describe('cartOrderText', () => {
  it('lists each line with its subtotal and the order total', () => {
    const text = cartOrderText([
      { name: 'Heladera Tokyo', quantity: 2, price: 2_500_000 },
      { name: 'Licuadora Jam', quantity: 1, price: 300_000 },
    ])
    expect(text.split('\n')).toEqual([
      'Hola, quiero hacer este pedido:',
      `- 2 × Heladera Tokyo: ${formatGs(5_000_000)}`,
      `- 1 × Licuadora Jam: ${formatGs(300_000)}`,
      `Total: ${formatGs(5_300_000)}`,
    ])
  })
})

describe('productInquiryText', () => {
  it('includes the code only when the product has one', () => {
    expect(productInquiryText('Cocina Philco', 'CP-1', 'https://x.test/p')).toBe(
      'Hola, quiero consultar por Cocina Philco (COD: CP-1).\nhttps://x.test/p',
    )
    expect(productInquiryText('Cocina Philco', null, 'https://x.test/p')).toBe(
      'Hola, quiero consultar por Cocina Philco.\nhttps://x.test/p',
    )
  })
})
