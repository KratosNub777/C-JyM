'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, type FormEvent } from 'react'
import { authClient } from '@/lib/customerAuth/client'

const inputClass =
  'w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-base outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20 dark:border-neutral-700 dark:bg-neutral-900'

export function CustomerAuthForm({
  register = false,
  destination = '/cuenta',
}: {
  register?: boolean
  destination?: '/cuenta' | '/checkout'
}) {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const email = String(form.get('email') ?? '').trim()
    const password = String(form.get('password') ?? '')
    const name = String(form.get('name') ?? '').trim()
    if (register && !name) {
      setMessage('Escribí tu nombre.')
      return
    }
    setSubmitting(true)
    setMessage('')
    try {
      const result = register
        ? await authClient.signUp.email({ email, password, name })
        : await authClient.signIn.email({ email, password })
      if (result.error) {
        if (result.error.status === 429)
          setMessage('Demasiados intentos. Esperá un minuto y volvé a intentar.')
        else if (!register) setMessage('Email o contraseña incorrectos. Revisá tus datos.')
        else
          setMessage(
            'No pudimos crear la cuenta. Revisá tus datos; si ya tenés una cuenta, ingresá.',
          )
        return
      }
      router.replace(destination)
      router.refresh()
    } catch {
      setMessage('No pudimos conectarnos. Intentá nuevamente.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="mx-auto max-w-md rounded-2xl border border-neutral-200 bg-white p-6 sm:p-8 dark:border-neutral-800 dark:bg-neutral-900/40">
      <p className="text-sm font-medium text-brand-600 dark:text-brand-400">
        Tu cuenta en Comercial José María
      </p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">
        {register ? 'Creá tu cuenta' : 'Bienvenido de nuevo'}
      </h1>
      <p className="mt-3 text-sm text-neutral-500 dark:text-neutral-400">
        {register
          ? 'Guardá tus datos y direcciones en un solo lugar.'
          : 'Ingresá para ver tu perfil y tus direcciones.'}
      </p>
      <form onSubmit={submit} className="mt-7 space-y-5" aria-busy={submitting}>
        <fieldset disabled={submitting} className="space-y-5">
          {register && (
            <label className="block text-sm font-medium">
              Nombre completo
              <input
                name="name"
                autoComplete="name"
                required
                maxLength={120}
                className={`${inputClass} mt-2`}
              />
            </label>
          )}
          <label className="block text-sm font-medium">
            Email
            <input
              name="email"
              type="email"
              autoComplete="email"
              required
              maxLength={254}
              className={`${inputClass} mt-2`}
            />
          </label>
          <div>
            <label htmlFor="customer-password" className="block text-sm font-medium">
              Contraseña
            </label>
            <div className="relative mt-2">
              <input
                id="customer-password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete={register ? 'new-password' : 'current-password'}
                required
                minLength={register ? 8 : undefined}
                maxLength={128}
                aria-describedby={register ? 'password-hint' : undefined}
                className={`${inputClass} pr-24`}
              />
              <button
                type="button"
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                aria-pressed={showPassword}
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 px-3 text-sm font-medium text-brand-600 dark:text-brand-400"
              >
                {showPassword ? 'Ocultar' : 'Mostrar'}
              </button>
            </div>
            {register && (
              <p id="password-hint" className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">
                Usá entre 8 y 128 caracteres.
              </p>
            )}
          </div>
        </fieldset>
        {message && (
          <p role="alert" className="text-sm text-red-600 dark:text-red-400">
            {message}
          </p>
        )}
        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-full bg-brand-600 px-5 py-3 text-base font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {submitting ? 'Un momento…' : register ? 'Crear cuenta' : 'Ingresar'}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-neutral-500 dark:text-neutral-400">
        {register ? '¿Ya tenés una cuenta?' : '¿Todavía no tenés cuenta?'}{' '}
        <Link
          href={`${register ? '/ingresar' : '/registrarse'}${destination === '/checkout' ? '?next=/checkout' : ''}`}
          className="font-semibold text-brand-600 underline-offset-4 hover:underline dark:text-brand-400"
        >
          {register ? 'Ingresá' : 'Registrate'}
        </Link>
      </p>
    </section>
  )
}
