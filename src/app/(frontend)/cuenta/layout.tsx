import type { Metadata } from 'next'
import { headers } from 'next/headers'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getCustomerSession } from '@/lib/customerAuth/session'

export const metadata: Metadata = { title: 'Mi cuenta', robots: { index: false, follow: false } }

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  if (!(await getCustomerSession(await headers()))) redirect('/ingresar')
  return (
    <div className="mx-auto max-w-3xl">
      <nav
        aria-label="Secciones de mi cuenta"
        className="mb-8 flex gap-6 border-b border-neutral-200 pb-4 text-sm font-medium dark:border-neutral-800"
      >
        <Link href="/cuenta" className="hover:text-brand-600">
          Mi cuenta
        </Link>
        <Link href="/cuenta/direcciones" className="hover:text-brand-600">
          Mis direcciones
        </Link>
      </nav>
      {children}
    </div>
  )
}
