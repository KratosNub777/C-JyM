import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { CheckoutForm } from '@/components/checkout/CheckoutForm'
import { getCustomerSession } from '@/lib/customerAuth/session'
import { getPayloadClient } from '@/lib/payload'
import { reservationHours } from '@/lib/checkout/reservationPolicy'

export const metadata: Metadata = {
  title: 'Confirmar pedido',
  robots: { index: false, follow: false },
}

export default async function CheckoutPage() {
  const session = await getCustomerSession(await headers())
  if (!session) redirect('/ingresar?next=/checkout')
  const payload = await getPayloadClient()
  const addresses = await payload.find({
    collection: 'addresses',
    where: { and: [{ customerId: { equals: session.user.id } }, { isDefault: { equals: true } }] },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })
  return (
    <CheckoutForm
      customerId={session.user.id}
      name={addresses.docs[0]?.fullName ?? session.user.name}
      email={session.user.email}
      phone={addresses.docs[0]?.phone ?? ''}
      reservationHours={reservationHours()}
    />
  )
}
