import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { ResetPasswordForm } from '@/components/customerAuth/ResetPasswordForm'
import { getCustomerSession } from '@/lib/customerAuth/session'

export const metadata: Metadata = {
  title: 'Restablecer contraseña',
  robots: { index: false, follow: false },
}

export default async function ResetPasswordPage() {
  if (await getCustomerSession(await headers())) redirect('/cuenta')
  return <ResetPasswordForm />
}
