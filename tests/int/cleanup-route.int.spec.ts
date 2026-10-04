// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
const mocks = vi.hoisted(() => ({ cleanup: vi.fn() }))
vi.mock('@/lib/customerAuth/auth', () => ({ customerAuthPool: 'pool' }))
vi.mock('@/lib/customerAuth/cleanup', () => ({ deleteStaleUnverifiedAccounts: mocks.cleanup }))
import { GET, POST } from '@/app/api/cron/cleanup-accounts/route'

const secret = 'test-only-cleanup-secret-with-at-least-32-characters'
const request = (authorization?: string) =>
  new Request('http://localhost/api/cron/cleanup-accounts', {
    method: 'POST',
    headers: authorization ? { authorization } : {},
  })
beforeEach(() => {
  vi.clearAllMocks()
  vi.stubEnv('CRON_SECRET', secret)
  mocks.cleanup.mockResolvedValue({ deleted: 2 })
})
afterEach(() => vi.unstubAllEnvs())

describe('Protected unverified account cleanup job', () => {
  it('fails closed without a valid job secret before touching the database', async () => {
    for (const authorization of [undefined, 'Bearer wrong', secret])
      expect((await POST(request(authorization))).status).toBe(401)
    vi.stubEnv('CRON_SECRET', '')
    expect((await GET(request(`Bearer ${secret}`))).status).toBe(401)
    expect(mocks.cleanup).not.toHaveBeenCalled()
  })

  it('runs the cleanup for the scheduler and reports only a count', async () => {
    const response = await GET(request(`Bearer ${secret}`))
    expect(response.status).toBe(200)
    expect(response.headers.get('cache-control')).toBe('no-store')
    expect(await response.json()).toEqual({ deleted: 2 })
    expect(mocks.cleanup).toHaveBeenCalledWith('pool')
  })

  it('reports a failure without details', async () => {
    mocks.cleanup.mockRejectedValue(new Error('connection refused'))
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const response = await POST(request(`Bearer ${secret}`))
    expect(response.status).toBe(503)
    expect(JSON.stringify(await response.json())).not.toContain('connection refused')
  })
})
