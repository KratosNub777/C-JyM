import { headers } from 'next/headers'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { SignOutButton } from '@/components/customerAuth/SignOutButton'
import { getCustomerSession } from '@/lib/customerAuth/session'

export default async function AccountPage() {
  const session = await getCustomerSession(await headers())
  if (!session) redirect('/ingresar')
  return (
    <>
      <h1 className="break-words text-3xl font-semibold tracking-tight">
        Hola, {session.user.name}
      </h1>
      <p className="mt-2 text-neutral-500 dark:text-neutral-400">
        Estos son los datos de tu cuenta.
      </p>
      <dl className="mt-6 space-y-5 rounded-xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900/40">
        <div>
          <dt className="text-sm text-neutral-500 dark:text-neutral-400">Nombre</dt>
          <dd className="mt-1 break-words font-medium">{session.user.name}</dd>
        </div>
        <div>
          <dt className="text-sm text-neutral-500 dark:text-neutral-400">Email</dt>
          <dd className="mt-1 break-all font-medium">{session.user.email}</dd>
        </div>
      </dl>
      <Link
        href="/cuenta/direcciones"
        className="mt-6 block rounded-xl border border-neutral-200 bg-white p-6 hover:border-brand-600 dark:border-neutral-800 dark:bg-neutral-900/40"
      >
        <span className="font-semibold">Mis direcciones →</span>
        <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
          Agregá o actualizá tus direcciones guardadas.
        </p>
      </Link>
      <SignOutButton className="mt-6 rounded-full border border-neutral-300 px-5 py-2.5 text-sm font-semibold hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800" />
    </>
  )
}
