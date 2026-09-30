'use client'

import { useRef, useState, useTransition } from 'react'
import { MAX_ADDRESSES } from '@/lib/customerAuth/addressFields'
import type { Address } from '@/payload-types'
import { AddressForm } from './AddressForm'
import { deleteAddress } from './actions'

export function AddressList({ addresses }: { addresses: Address[] }) {
  const [editing, setEditing] = useState<number | 'new' | null>(null)
  const [deleting, setDeleting] = useState<number | null>(null)
  const [pending, startTransition] = useTransition()
  const [message, setMessage] = useState('')
  const addButton = useRef<HTMLButtonElement>(null)
  function done() {
    setEditing(null)
    addButton.current?.focus()
  }
  function remove(id: number) {
    setMessage('')
    startTransition(async () => {
      try {
        const result = await deleteAddress(id)
        if (result.success) {
          setDeleting(null)
          addButton.current?.focus()
        } else setMessage(result.error)
      } catch {
        setMessage('No se pudo eliminar. Intentá nuevamente.')
      }
    })
  }
  const limitReached = addresses.length >= MAX_ADDRESSES
  const cardClass =
    'rounded-xl border border-neutral-200 bg-white p-5 sm:p-6 dark:border-neutral-800 dark:bg-neutral-900/40'
  return (
    <div className="mt-6 space-y-4">
      {addresses.length === 0 && editing !== 'new' && (
        <div className={`${cardClass} text-center`}>
          <p className="font-medium">Todavía no guardaste ninguna dirección.</p>
          <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
            Agregá la primera para tener tus datos a mano.
          </p>
        </div>
      )}
      {addresses.map((address) => (
        <section
          key={address.id}
          className={cardClass}
          aria-label={`Dirección de ${address.fullName}`}
        >
          {editing === address.id ? (
            <>
              <h2 className="text-lg font-semibold">Editar dirección</h2>
              <AddressForm address={address} onDone={done} />
            </>
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="break-words font-semibold">{address.fullName}</h2>
                {address.isDefault && (
                  <span className="rounded-full bg-brand-600/10 px-3 py-1 text-xs font-medium text-brand-700 dark:text-brand-400">
                    Predeterminada
                  </span>
                )}
              </div>
              <p className="mt-3 whitespace-pre-line break-words text-sm">{address.addressLine}</p>
              <p className="mt-1 break-words text-sm text-neutral-500 dark:text-neutral-400">
                {address.city}, {address.department}
              </p>
              <p className="mt-2 text-sm">{address.phone}</p>
              {deleting === address.id ? (
                <div className="mt-4 rounded-lg bg-neutral-100 p-4 dark:bg-neutral-800">
                  <p className="text-sm">¿Eliminar esta dirección?</p>
                  <div className="mt-3 flex gap-4">
                    <button
                      autoFocus
                      type="button"
                      disabled={pending}
                      onClick={() => remove(address.id)}
                      className="text-sm font-semibold text-red-600 disabled:opacity-50 dark:text-red-400"
                    >
                      {pending ? 'Eliminando…' : 'Sí, eliminar'}
                    </button>
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => setDeleting(null)}
                      className="text-sm font-medium"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mt-4 flex gap-5 text-sm font-semibold">
                  <button
                    type="button"
                    disabled={editing !== null || pending}
                    onClick={() => {
                      setEditing(address.id)
                      setDeleting(null)
                      setMessage('')
                    }}
                    className="text-brand-600 disabled:opacity-50 dark:text-brand-400"
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    disabled={editing !== null || pending}
                    onClick={() => {
                      setDeleting(address.id)
                      setMessage('')
                    }}
                    className="text-neutral-500 disabled:opacity-50 dark:text-neutral-400"
                  >
                    Eliminar
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      ))}
      {message && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {message}
        </p>
      )}
      {editing === 'new' && (
        <section className={cardClass}>
          <h2 className="text-lg font-semibold">Nueva dirección</h2>
          <AddressForm onDone={done} />
        </section>
      )}
      <button
        ref={addButton}
        type="button"
        disabled={editing !== null || pending || limitReached}
        onClick={() => {
          setEditing('new')
          setDeleting(null)
          setMessage('')
        }}
        className="rounded-full bg-brand-600 px-5 py-3 font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
      >
        Agregar dirección
      </button>
      {limitReached && (
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          Llegaste al máximo de {MAX_ADDRESSES} direcciones. Eliminá una para agregar otra.
        </p>
      )}
    </div>
  )
}
