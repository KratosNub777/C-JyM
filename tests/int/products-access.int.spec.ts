// @vitest-environment node
import { randomUUID } from 'node:crypto'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { getPayload, type Payload } from 'payload'
import config from '@/payload.config'
import { Products } from '@/collections/Products'

const run = randomUUID().slice(0, 8)
let payload: Payload
const ids: number[] = []
let categoryId: number

describe('Products read access', () => {
  beforeAll(async () => {
    payload = await getPayload({ config, key: `products-access-${run}` })
    const category = await payload.create({
      collection: 'categories',
      data: { name: `Acceso ${run}`, slug: `acceso-${run}` },
    })
    categoryId = category.id
    for (const status of ['active', 'inactive'] as const) {
      const product = await payload.create({
        collection: 'products',
        data: {
          name: `Producto ${status} ${run}`,
          slug: `producto-${status}-${run}`,
          price: 100000,
          stock: 5,
          status,
          category: categoryId,
        },
      })
      ids.push(product.id)
    }
  })

  afterAll(async () => {
    for (const id of ids) await payload.delete({ collection: 'products', id })
    if (categoryId) await payload.delete({ collection: 'categories', id: categoryId })
    await payload.destroy()
  })

  it('lets an anonymous visitor read only active products', async () => {
    const found = await payload.find({
      collection: 'products',
      where: { id: { in: ids } },
      overrideAccess: false,
      depth: 0,
    })
    expect(found.docs.map((doc) => doc.status)).toEqual(['active'])
  })

  it('does not reveal an inactive product by its id either', async () => {
    const inactiveId = ids[1]
    await expect(
      payload.findByID({ collection: 'products', id: inactiveId, overrideAccess: false }),
    ).rejects.toThrow()
  })

  it('keeps every product visible to a signed in administrator', () => {
    const read = Products.access?.read as (args: { req: { user: unknown } }) => unknown
    expect(read({ req: { user: { id: 1 } } })).toBe(true)
    expect(read({ req: { user: null } })).toEqual({ status: { equals: 'active' } })
  })
})
