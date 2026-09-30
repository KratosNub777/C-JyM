import type { ReactNode } from 'react'

export const authInputClass =
  'w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-base outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20 dark:border-neutral-700 dark:bg-neutral-900'

export const authButtonClass =
  'w-full rounded-full bg-brand-600 px-5 py-3 text-base font-semibold text-white hover:bg-brand-700 disabled:opacity-50'

export function AuthCard({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle: ReactNode
  children: ReactNode
}) {
  return (
    <section className="mx-auto max-w-md rounded-2xl border border-neutral-200 bg-white p-6 sm:p-8 dark:border-neutral-800 dark:bg-neutral-900/40">
      <p className="text-sm font-medium text-brand-600 dark:text-brand-400">
        Tu cuenta en Comercial José María
      </p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">{title}</h1>
      <p className="mt-3 text-sm text-neutral-500 dark:text-neutral-400">{subtitle}</p>
      {children}
    </section>
  )
}
