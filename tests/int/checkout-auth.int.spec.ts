// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest'
const mocks = vi.hoisted(() => ({ session: vi.fn(), payload: vi.fn(), limit: vi.fn() }))
vi.mock('next/headers', () => ({ headers: async () => new Headers() }))
vi.mock('next/cache', () => ({ revalidateTag: vi.fn(), revalidatePath: vi.fn() }))
vi.mock('@/lib/customerAuth/session', () => ({ getCustomerSession: mocks.session }))
vi.mock('@/lib/customerAuth/actionLimit', () => ({
  ACTION_LIMIT_MESSAGE: 'Hiciste muchos intentos seguidos.',
  withinActionLimit: mocks.limit,
}))
vi.mock('@/lib/payload', () => ({ getPayloadClient: mocks.payload }))
import { cancelOrder, placeOrder } from '@/lib/checkout/actions'

beforeEach(() => vi.clearAllMocks())

describe('Checkout action authorization', () => {
  it('requires a customer session for creation and cancellation before accessing the database', async () => {
    mocks.session.mockResolvedValue(null)
    expect(await placeOrder({ customerId: 'victim' })).toMatchObject({ ok: false, code: 'AUTH' })
    expect(await cancelOrder(1)).toMatchObject({ ok: false, code: 'AUTH' })
    expect(mocks.payload).not.toHaveBeenCalled()
    expect(mocks.limit).not.toHaveBeenCalled()
  })

  it('stops a customer past the action limit before touching orders', async () => {
    mocks.session.mockResolvedValue({ user: { id: 'cliente-1', email: 'c@example.com' } })
    mocks.limit.mockResolvedValue(false)
    const limited = { ok: false, code: 'FAILED', message: 'Hiciste muchos intentos seguidos.' }
    expect(await placeOrder({})).toEqual(limited)
    expect(await cancelOrder(1)).toEqual(limited)
    expect(mocks.limit).toHaveBeenCalledWith('checkout', 'cliente-1')
    expect(mocks.payload).not.toHaveBeenCalled()
  })
})
