// @vitest-environment node
import { randomUUID } from 'node:crypto'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { getPayload, type Payload } from 'payload'
import config from '@/payload.config'
import { COMPARE_AT_PRICE_ERROR, validateProductFields } from '@/lib/validateProductFields'

const run = randomUUID().slice(0, 8)
let payload: Payload
const ids: number[] = []
let categoryId: number

const formInput = { name: 'Heladera', hasCategory: true, price: '1000000', stock: '3' }

describe('validateProductFields (formulario /catalogar)', () => {
  it('accepts a list price above the cash price or no list price at all', () => {
    expect(validateProductFields({ ...formInput, compareAtPrice: '1200000' })).toBeNull()
    expect(validateProductFields(formInput)).toBeNull()
  })

  it('rejects a list price equal to or below the cash price', () => {
    expect(validateProductFields({ ...formInput, compareAtPrice: '1000000' })).toBe(
      COMPARE_AT_PRICE_ERROR,
    )
    expect(validateProductFields({ ...formInput, compareAtPrice: '900000' })).toBe(
      COMPARE_AT_PRICE_ERROR,
    )
    expect(validateProductFields({ ...formInput, compareAtPrice: '0' })).toBe(
      COMPARE_AT_PRICE_ERROR,
    )
  })
})

describe('Products compareAtPrice validation', () => {
  beforeAll(async () => {
    payload = await getPayload({ config, key: `product-price-validation-${run}` })
    // Nunca crear ni borrar categorías en los tests: se usa la primera existente.
    categoryId = (await payload.find({ collection: 'categories', limit: 1, depth: 0 })).docs[0].id
  })

  afterAll(async () => {
    for (const id of ids) await payload.delete({ collection: 'products', id })
    await payload.destroy()
  })

  async function createProduct(suffix: string, prices: { price: number; compareAtPrice?: number }) {
    const product = await payload.create({
      collection: 'products',
      data: {
        name: `Producto precio ${suffix} ${run}`,
        slug: `producto-precio-${suffix}-${run}`,
        stock: 1,
        // Inactivo para que no aparezca en el catálogo de desarrollo mientras corre el test.
        status: 'inactive',
        category: categoryId,
        ...prices,
      },
    })
    ids.push(product.id)
    return product
  }

  it('saves a product whose list price is above its cash price', async () => {
    const product = await createProduct('valido', { price: 100000, compareAtPrice: 120000 })
    expect(product.compareAtPrice).toBe(120000)
  })

  it('rejects creating a product whose list price is not above its cash price', async () => {
    await expect(createProduct('igual', { price: 100000, compareAtPrice: 100000 })).rejects.toThrow(
      /precio de lista/i,
    )
    await expect(createProduct('menor', { price: 100000, compareAtPrice: 90000 })).rejects.toThrow(
      /precio de lista/i,
    )
  })

  it('rejects raising only the cash price above the stored list price', async () => {
    const product = await createProduct('parcial', { price: 100000, compareAtPrice: 120000 })
    await expect(
      payload.update({ collection: 'products', id: product.id, data: { price: 130000 } }),
    ).rejects.toThrow(/precio de lista/i)
  })

  it('allows clearing the list price and then any cash price', async () => {
    const product = await createProduct('limpiar', { price: 100000, compareAtPrice: 120000 })
    const updated = await payload.update({
      collection: 'products',
      id: product.id,
      data: { compareAtPrice: null, price: 130000 },
    })
    expect(updated.compareAtPrice).toBeNull()
    expect(updated.price).toBe(130000)
  })
})
