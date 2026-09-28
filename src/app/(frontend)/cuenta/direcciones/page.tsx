import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { getCustomerSession } from '@/lib/customerAuth/session'
import { getPayloadClient } from '@/lib/payload'
import { AddressList } from './AddressList'

export const metadata: Metadata = { title: 'Mis direcciones' }

export default async function AddressesPage() {
  const session = await getCustomerSession(await headers())
  if (!session) redirect('/ingresar')
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'addresses',
    where: { customerId: { equals: session.user.id } },
    overrideAccess: true,
    depth: 0,
    pagination: false,
    sort: '-createdAt',
  })
  return (
    <>
      <h1 className="text-3xl font-semibold tracking-tight">Mis direcciones</h1>
      <p className="mt-2 text-neutral-500 dark:text-neutral-400">
        Guardá, editá y elegí tu dirección predeterminada.
      </p>
      <AddressList addresses={docs} />
    </>
  )
}
