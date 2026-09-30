import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { ForgotPasswordForm } from '@/components/customerAuth/ForgotPasswordForm'
import { getCustomerSession } from '@/lib/customerAuth/session'

export const metadata: Metadata = {
  title: 'Recuperar contraseña',
  robots: { index: false, follow: false },
}

export default async function ForgotPasswordPage() {
  if (await getCustomerSession(await headers())) redirect('/cuenta')
  return <ForgotPasswordForm />
}
