import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { VerifyEmailForm } from '@/components/customerAuth/VerifyEmailForm'
import { getCustomerSession } from '@/lib/customerAuth/session'

export const metadata: Metadata = {
  title: 'Verificar email',
  robots: { index: false, follow: false },
}

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>
}) {
  const destination = (await searchParams).next === '/checkout' ? '/checkout' : '/cuenta'
  if (await getCustomerSession(await headers())) redirect(destination)
  return <VerifyEmailForm destination={destination} />
}
