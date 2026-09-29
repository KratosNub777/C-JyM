// @vitest-environment node
import { describe, expect, it, vi } from 'vitest'
const mocks = vi.hoisted(() => ({ session: vi.fn(), payload: vi.fn() }))
vi.mock('next/headers', () => ({ headers: async () => new Headers() }))
vi.mock('next/cache', () => ({ revalidateTag: vi.fn(), revalidatePath: vi.fn() }))
vi.mock('@/lib/customerAuth/session', () => ({ getCustomerSession: mocks.session }))
vi.mock('@/lib/payload', () => ({ getPayloadClient: mocks.payload }))
import { cancelOrder, placeOrder } from '@/lib/checkout/actions'

describe('Checkout action authorization', () => {
  it('requires a customer session for creation and cancellation before accessing the database', async () => {
    mocks.session.mockResolvedValue(null)
    expect(await placeOrder({ customerId: 'victim' })).toMatchObject({ ok: false, code: 'AUTH' })
    expect(await cancelOrder(1)).toMatchObject({ ok: false, code: 'AUTH' })
    expect(mocks.payload).not.toHaveBeenCalled()
  })
})
