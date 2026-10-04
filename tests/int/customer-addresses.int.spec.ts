// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  session: vi.fn(),
  payload: vi.fn(),
  revalidate: vi.fn(),
  db: {
    beginTransaction: vi.fn(),
    commitTransaction: vi.fn(),
    rollbackTransaction: vi.fn(),
    execute: vi.fn(),
    sessions: { tx: { db: {} } },
  },
  find: vi.fn(),
  count: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  limit: vi.fn(),
}))
vi.mock('next/headers', () => ({ headers: async () => new Headers() }))
vi.mock('@/lib/customerAuth/actionLimit', () => ({
  ACTION_LIMIT_MESSAGE: 'Hiciste muchos intentos seguidos.',
  withinActionLimit: mocks.limit,
}))
vi.mock('next/cache', () => ({ revalidatePath: mocks.revalidate }))
vi.mock('@/lib/customerAuth/session', () => ({ getCustomerSession: mocks.session }))
vi.mock('@/lib/payload', () => ({ getPayloadClient: mocks.payload }))

import { MAX_ADDRESSES } from '@/lib/customerAuth/addressFields'
import {
  createAddress,
  deleteAddress,
  updateAddress,
} from '@/app/(frontend)/cuenta/direcciones/actions'

function form(isDefault = false) {
  const result = new FormData()
  for (const [key, value] of Object.entries({
    fullName: 'Cliente',
    phone: '0981 123456',
    department: 'Central',
    city: 'Luque',
    addressLine: 'Dirección de prueba',
    customerId: 'victim',
  }))
    result.set(key, value)
  if (isDefault) result.set('isDefault', 'on')
  return result
}

describe('Customer address authorization and transactions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.session.mockResolvedValue({ user: { id: 'customer-a' } })
    mocks.limit.mockResolvedValue(true)
    mocks.payload.mockResolvedValue(mocks)
    mocks.db.beginTransaction.mockResolvedValue('tx')
    mocks.find.mockResolvedValue({ docs: [{ id: 7 }] })
    mocks.count.mockResolvedValue({ totalDocs: 0 })
    mocks.update.mockResolvedValue({ docs: [{ id: 7 }], errors: [] })
    mocks.delete.mockResolvedValue({ docs: [{ id: 7 }], errors: [] })
    mocks.create.mockResolvedValue({ id: 7 })
  })

  it('rejects unauthenticated creates, updates and deletes before touching Payload', async () => {
    mocks.session.mockResolvedValue(null)
    for (const result of [
      await createAddress(form()),
      await updateAddress(7, form()),
      await deleteAddress(7),
    ])
      expect(result.success).toBe(false)
    expect(mocks.payload).not.toHaveBeenCalled()
  })

  it('stops a customer past the action limit before touching Payload', async () => {
    mocks.limit.mockResolvedValue(false)
    for (const result of [
      await createAddress(form()),
      await updateAddress(7, form()),
      await deleteAddress(7),
    ])
      expect(result).toEqual({ success: false, error: 'Hiciste muchos intentos seguidos.' })
    expect(mocks.limit).toHaveBeenCalledWith('addresses', 'customer-a')
    expect(mocks.payload).not.toHaveBeenCalled()
  })

  it('takes ownership exclusively from the session', async () => {
    expect((await createAddress(form())).success).toBe(true)
    expect(mocks.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ customerId: 'customer-a' }),
        req: { transactionID: 'tx' },
      }),
    )
  })

  it('does not change foreign addresses or defaults when a forged ID is supplied', async () => {
    mocks.find.mockResolvedValue({ docs: [] })
    expect((await updateAddress(99, form(true))).success).toBe(false)
    expect((await deleteAddress(99)).success).toBe(false)
    expect(mocks.find).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { and: [{ customerId: { equals: 'customer-a' } }, { id: { equals: 99 } }] },
      }),
    )
    expect(mocks.update).not.toHaveBeenCalled()
    expect(mocks.delete).not.toHaveBeenCalled()
    expect(mocks.db.commitTransaction).not.toHaveBeenCalled()
  })

  it('rejects invalid data and IDs before starting a transaction', async () => {
    const invalid = form()
    invalid.set('phone', 'invalid')
    expect((await createAddress(invalid)).success).toBe(false)
    invalid.set('phone', '0981234567')
    invalid.set('department', 'Atlantis')
    expect((await createAddress(invalid)).success).toBe(false)
    expect((await updateAddress(NaN, form())).success).toBe(false)
    expect((await deleteAddress(-1)).success).toBe(false)
    expect(mocks.payload).not.toHaveBeenCalled()
  })

  it('rolls back clearing defaults if saving the new address fails', async () => {
    mocks.create.mockRejectedValueOnce(new Error('Database failure'))
    expect((await createAddress(form(true))).success).toBe(false)
    expect(mocks.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { customerId: { equals: 'customer-a' } },
        data: { isDefault: false },
        req: { transactionID: 'tx' },
      }),
    )
    expect(mocks.db.rollbackTransaction).toHaveBeenCalledWith('tx')
    expect(mocks.db.commitTransaction).not.toHaveBeenCalled()
    expect(mocks.revalidate).not.toHaveBeenCalled()
  })

  it('rolls back bulk-operation errors instead of reporting a successful edit', async () => {
    mocks.update.mockResolvedValueOnce({ docs: [], errors: [{ message: 'Failed' }] })
    expect((await updateAddress(7, form())).success).toBe(false)
    expect(mocks.db.rollbackTransaction).toHaveBeenCalledWith('tx')
    expect(mocks.revalidate).not.toHaveBeenCalled()
  })

  it('refuses to create more than the maximum number of addresses', async () => {
    mocks.count.mockResolvedValue({ totalDocs: MAX_ADDRESSES })
    const result = await createAddress(form(true))
    expect(result).toEqual({ success: false, error: expect.stringContaining(`${MAX_ADDRESSES}`) })
    expect(mocks.count).toHaveBeenCalledWith(
      expect.objectContaining({ where: { customerId: { equals: 'customer-a' } } }),
    )
    expect(mocks.update).not.toHaveBeenCalled()
    expect(mocks.create).not.toHaveBeenCalled()
    expect(mocks.db.rollbackTransaction).toHaveBeenCalledWith('tx')
    expect(mocks.db.commitTransaction).not.toHaveBeenCalled()
  })

  it('still allows editing and deleting when the limit is reached', async () => {
    mocks.count.mockResolvedValue({ totalDocs: MAX_ADDRESSES })
    expect((await updateAddress(7, form())).success).toBe(true)
    expect((await deleteAddress(7)).success).toBe(true)
  })
})
