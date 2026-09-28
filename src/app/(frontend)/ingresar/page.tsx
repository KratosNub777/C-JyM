import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { CustomerAuthForm } from '@/components/customerAuth/CustomerAuthForm'
import { getCustomerSession } from '@/lib/customerAuth/session'

export const metadata: Metadata = { title: 'Ingresar', robots: { index: false, follow: false } }

export default async function LoginPage() {
  if (await getCustomerSession(await headers())) redirect('/cuenta')
  return <CustomerAuthForm />
}
