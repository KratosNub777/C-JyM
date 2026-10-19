// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({ find: vi.fn() }))
vi.mock('next/cache', () => ({ unstable_cache: (fn: unknown) => fn }))
vi.mock('@/lib/payload', () => ({ getPayloadClient: async () => ({ find: mocks.find }) }))

import { getProductBySlug } from '@/lib/products'

describe('getProductBySlug', () => {
  beforeEach(() => mocks.find.mockReset())

  it('only looks up active products, so a draft is not reachable by its URL', async () => {
    mocks.find.mockResolvedValue({ docs: [] })
    await expect(getProductBySlug('borrador')).resolves.toBeNull()
    expect(mocks.find.mock.calls[0][0].where).toEqual({
      and: [{ slug: { equals: 'borrador' } }, { status: { equals: 'active' } }],
    })
  })

  it('returns the product when it exists', async () => {
    mocks.find.mockResolvedValue({ docs: [{ slug: 'heladera-a' }] })
    await expect(getProductBySlug('heladera-a')).resolves.toEqual({ slug: 'heladera-a' })
  })
})
