// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({ find: vi.fn() }))
vi.mock('@/lib/payload', () => ({ getPayloadClient: async () => ({ find: mocks.find }) }))
vi.mock('@/lib/site', () => ({ getSiteUrl: () => 'https://tienda.example' }))

import sitemap, { revalidate } from '@/app/sitemap'

describe('sitemap', () => {
  beforeEach(() => {
    mocks.find.mockReset()
    mocks.find.mockImplementation(async ({ collection }: { collection: string }) => ({
      docs:
        collection === 'products'
          ? [{ slug: 'heladera-a', updatedAt: '2026-10-01T00:00:00.000Z' }]
          : [{ slug: 'heladeras', updatedAt: '2026-09-30T00:00:00.000Z' }],
    }))
  })

  it('is regenerated periodically instead of being frozen at build time', () => {
    expect(Number.isInteger(revalidate)).toBe(true)
    expect(revalidate).toBeGreaterThan(0)
    expect(revalidate).toBeLessThanOrEqual(86400)
  })

  it('lists the fixed pages, the categories and the active products', async () => {
    const urls = (await sitemap()).map((entry) => entry.url)
    expect(urls).toEqual([
      'https://tienda.example',
      'https://tienda.example/productos',
      'https://tienda.example/ofertas',
      'https://tienda.example/categorias/heladeras',
      'https://tienda.example/productos/heladera-a',
    ])
  })

  it('only asks for active products', async () => {
    await sitemap()
    const productsCall = mocks.find.mock.calls.find(([args]) => args.collection === 'products')
    expect(productsCall?.[0].where).toEqual({ status: { equals: 'active' } })
  })
})
