// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
const mocks = vi.hoisted(() => ({ payload: vi.fn(), expire: vi.fn(), refresh: vi.fn() }))
vi.mock('@/lib/payload', () => ({ getPayloadClient: mocks.payload }))
vi.mock('@/lib/checkout/expireOrders', () => ({ expirePendingOrders: mocks.expire }))
vi.mock('@/lib/checkout/refreshOrderCache', () => ({ refreshOrderCache: mocks.refresh }))
import { GET, POST } from '@/app/api/cron/expire-orders/route'

const secret = 'test-only-expiration-secret-at-least-32-characters'
const request = (authorization?: string) =>
  new Request('http://localhost/api/cron/expire-orders?orderId=999', {
    method: 'POST',
    headers: authorization ? { authorization } : {},
  })
beforeEach(() => {
  vi.clearAllMocks()
  vi.stubEnv('CRON_SECRET', secret)
  mocks.expire.mockResolvedValue({
    expired: 1,
    failed: 0,
    skipped: 0,
    backfilled: 0,
    hasMore: false,
  })
})
afterEach(() => vi.unstubAllEnvs())

describe('Protected expiration job', () => {
  it('fails closed without a valid job secret before querying the database', async () => {
    for (const authorization of [undefined, `Bearer wrong`, secret, `Bearer ${'x'.repeat(600)}`])
      expect((await POST(request(authorization))).status).toBe(401)
    vi.stubEnv('CRON_SECRET', '')
    expect((await GET(request(`Bearer ${secret}`))).status).toBe(401)
    expect(mocks.payload).not.toHaveBeenCalled()
    expect(mocks.expire).not.toHaveBeenCalled()
  })
  it('accepts the scheduler token, ignores caller IDs and returns no customer data', async () => {
    mocks.payload.mockResolvedValue('database')
    const response = await POST(request(`Bearer ${secret}`))
    expect(response.status).toBe(200)
    expect(response.headers.get('cache-control')).toBe('no-store')
    expect(await response.json()).toEqual({
      expired: 1,
      failed: 0,
      skipped: 0,
      backfilled: 0,
      hasMore: false,
    })
    expect(mocks.expire).toHaveBeenCalledWith('database')
    expect(mocks.refresh).toHaveBeenCalledOnce()
  })
  it('reports partial failures for scheduler retries while refreshing committed stock', async () => {
    mocks.expire.mockResolvedValue({
      expired: 1,
      failed: 1,
      skipped: 0,
      backfilled: 0,
      hasMore: false,
    })
    expect((await POST(request(`Bearer ${secret}`))).status).toBe(503)
    expect(mocks.refresh).toHaveBeenCalledOnce()
  })
})
