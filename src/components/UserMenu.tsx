'use client'

import { User } from '@phosphor-icons/react'
import Link from 'next/link'
import { useCallback, useRef, useState } from 'react'
import { authClient } from '@/lib/customerAuth/client'
import { useClickOutside } from '@/lib/useClickOutside'
import { SignOutButton } from './customerAuth/SignOutButton'

export function UserMenu() {
  // Keep the catalog eligible for ISR; customer data is never stored in its HTML cache.
  const { data: session, isPending } = authClient.useSession()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const close = useCallback(() => setOpen(false), [])
  useClickOutside(ref, close)
  const iconClass =
    'flex h-10 w-10 items-center justify-center rounded-full text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-white'
  if (isPending)
    return (
      <span className={iconClass} aria-label="Cargando cuenta">
        <User size={22} />
      </span>
    )
  if (!session)
    return (
      <Link href="/ingresar" aria-label="Iniciar sesión" className={iconClass}>
        <User size={22} />
      </Link>
    )
  return (
    <div
      ref={ref}
      className="relative"
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          close()
          buttonRef.current?.focus()
        }
      }}
    >
      <button
        ref={buttonRef}
        type="button"
        aria-label="Menú de mi cuenta"
        aria-expanded={open}
        aria-controls="customer-menu"
        onClick={() => setOpen(!open)}
        className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-600 font-semibold text-white hover:bg-brand-700"
      >
        {session.user.name.trim().charAt(0).toUpperCase() || <User size={22} />}
      </button>
      {open && (
        <div
          id="customer-menu"
          className="absolute right-0 top-12 z-50 w-64 rounded-xl border border-neutral-200 bg-white p-2 shadow-lg dark:border-neutral-700 dark:bg-neutral-900"
        >
          <p className="truncate px-3 py-2 text-sm font-semibold">{session.user.name}</p>
          <nav aria-label="Mi cuenta" className="flex flex-col text-sm">
            <Link
              href="/cuenta"
              onClick={close}
              className="rounded-lg px-3 py-2 hover:bg-neutral-100 dark:hover:bg-neutral-800"
            >
              Mi cuenta
            </Link>
            <Link
              href="/cuenta/direcciones"
              onClick={close}
              className="rounded-lg px-3 py-2 hover:bg-neutral-100 dark:hover:bg-neutral-800"
            >
              Mis direcciones
            </Link>
            <Link
              href="/cuenta/pedidos"
              onClick={close}
              className="rounded-lg px-3 py-2 hover:bg-neutral-100 dark:hover:bg-neutral-800"
            >
              Mis pedidos
            </Link>
            <SignOutButton className="w-full rounded-lg px-3 py-2 text-left hover:bg-neutral-100 dark:hover:bg-neutral-800" />
          </nav>
        </div>
      )}
    </div>
  )
}
