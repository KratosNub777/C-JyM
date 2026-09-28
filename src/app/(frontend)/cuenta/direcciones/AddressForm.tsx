'use client'

import { useState, useTransition, type FormEvent } from 'react'
import { departments } from '@/lib/customerAuth/addressFields'
import type { Address } from '@/payload-types'
import { createAddress, updateAddress } from './actions'

const inputClass =
  'mt-2 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-base outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20 dark:border-neutral-700 dark:bg-neutral-900'

export function AddressForm({ address, onDone }: { address?: Address; onDone: () => void }) {
  const [pending, startTransition] = useTransition()
  const [message, setMessage] = useState('')
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    setMessage('')
    startTransition(async () => {
      try {
        const result = address ? await updateAddress(address.id, form) : await createAddress(form)
        if (result.success) onDone()
        else setMessage(result.error)
      } catch {
        setMessage('No se pudo guardar. Revisá tu conexión e intentá de nuevo.')
      }
    })
  }
  return (
    <form onSubmit={submit} className="mt-5" aria-busy={pending}>
      <fieldset disabled={pending} className="grid gap-5 sm:grid-cols-2">
        <label className="text-sm font-medium">
          Destinatario
          <input
            autoFocus
            name="fullName"
            autoComplete="shipping name"
            required
            maxLength={120}
            defaultValue={address?.fullName}
            className={inputClass}
          />
        </label>
        <label className="text-sm font-medium">
          Teléfono
          <input
            name="phone"
            type="tel"
            autoComplete="shipping tel"
            required
            minLength={6}
            maxLength={30}
            defaultValue={address?.phone}
            placeholder="Ej.: 0981 123 456"
            className={inputClass}
          />
        </label>
        <label className="text-sm font-medium">
          Departamento
          <select
            name="department"
            autoComplete="shipping address-level1"
            required
            defaultValue={address?.department ?? ''}
            className={inputClass}
          >
            <option value="" disabled>
              Seleccioná un departamento
            </option>
            {departments.map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
        </label>
        <label className="text-sm font-medium">
          Ciudad
          <input
            name="city"
            autoComplete="shipping address-level2"
            required
            maxLength={100}
            defaultValue={address?.city}
            className={inputClass}
          />
        </label>
        <label className="text-sm font-medium sm:col-span-2">
          Dirección / referencia
          <textarea
            name="addressLine"
            autoComplete="shipping street-address"
            required
            maxLength={500}
            rows={3}
            defaultValue={address?.addressLine}
            className={inputClass}
          />
        </label>
        <label className="flex items-center gap-3 text-sm sm:col-span-2">
          <input
            name="isDefault"
            type="checkbox"
            defaultChecked={address?.isDefault ?? false}
            className="h-4 w-4 accent-brand-600"
          />
          Usar como dirección predeterminada
        </label>
      </fieldset>
      {message && (
        <p role="alert" className="mt-4 text-sm text-red-600 dark:text-red-400">
          {message}
        </p>
      )}
      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-brand-600 px-5 py-3 font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {pending ? 'Guardando…' : 'Guardar dirección'}
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={onDone}
          className="rounded-full border border-neutral-300 px-5 py-3 font-medium hover:bg-neutral-100 disabled:opacity-50 dark:border-neutral-700 dark:hover:bg-neutral-800"
        >
          Cancelar
        </button>
      </div>
    </form>
  )
}
