'use server'

import { sql } from '@payloadcms/db-postgres'
import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'
import { getCustomerSession } from '@/lib/customerAuth/session'
import { parseAddress, type AddressResult } from '@/lib/customerAuth/addressFields'
import { getPayloadClient } from '@/lib/payload'
import { withTransaction } from '@/lib/transaction'

// Expected failures with a message that is safe to show; anything else becomes a generic error.
class AddressError extends Error {}

async function mutateAddress(
  operation: 'create' | 'update' | 'delete',
  id?: number,
  form?: FormData,
): Promise<AddressResult> {
  const session = await getCustomerSession(await headers())
  if (!session) return { success: false, error: 'Tu sesión venció. Volvé a ingresar.' }
  if (operation !== 'create' && (!Number.isSafeInteger(id) || id! <= 0)) {
    return { success: false, error: 'La dirección no existe.' }
  }
  const data = form ? parseAddress(form) : null
  if (operation !== 'delete' && !data) {
    return { success: false, error: 'Revisá los campos y escribí un teléfono válido.' }
  }

  const payload = await getPayloadClient()
  const owner = { customerId: { equals: session.user.id } }
  const target = { and: [owner, { id: { equals: id } }] }
  try {
    await withTransaction(payload, async (req, db) => {
      // Serialize mutations for this customer, including requests from different tabs/instances.
      // Clearing the old default and saving the new one share the same transaction.
      await payload.db.execute({
        db,
        sql: sql`SELECT pg_advisory_xact_lock(hashtextextended(${session.user.id}, 0))`,
      })
      if (operation !== 'create') {
        const existing = await payload.find({
          collection: 'addresses',
          where: target,
          limit: 1,
          depth: 0,
          overrideAccess: true,
          req,
        })
        if (!existing.docs.length) throw new AddressError('La dirección no existe.')
      }
      if (data?.isDefault) {
        const cleared = await payload.update({
          collection: 'addresses',
          where: owner,
          data: { isDefault: false },
          overrideAccess: true,
          req,
        })
        if (cleared.errors.length) throw new Error('Unable to clear default address')
      }
      if (operation === 'create' && data) {
        await payload.create({
          collection: 'addresses',
          data: { ...data, customerId: session.user.id },
          overrideAccess: true,
          req,
        })
      } else if (operation === 'update' && data) {
        const updated = await payload.update({
          collection: 'addresses',
          where: target,
          data,
          overrideAccess: true,
          req,
        })
        if (updated.errors.length || updated.docs.length !== 1)
          throw new Error('Unable to update address')
      } else {
        const deleted = await payload.delete({
          collection: 'addresses',
          where: target,
          overrideAccess: true,
          req,
        })
        if (deleted.errors.length || deleted.docs.length !== 1)
          throw new Error('Unable to delete address')
      }
    })
  } catch (error) {
    if (error instanceof AddressError) return { success: false, error: error.message }
    return { success: false, error: 'No se pudo guardar el cambio. Intentá nuevamente.' }
  }
  revalidatePath('/cuenta/direcciones')
  return { success: true }
}

export async function createAddress(form: FormData) {
  return mutateAddress('create', undefined, form)
}
export async function updateAddress(id: number, form: FormData) {
  return mutateAddress('update', id, form)
}
export async function deleteAddress(id: number) {
  return mutateAddress('delete', id)
}
