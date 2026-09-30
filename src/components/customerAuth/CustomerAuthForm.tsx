'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, type FormEvent } from 'react'
import { authClient } from '@/lib/customerAuth/client'
import { authFailureMessage, isEmailNotVerified } from '@/lib/customerAuth/errors'
import { savePendingEmail } from '@/lib/customerAuth/pendingEmail'
import { AuthCard, authButtonClass, authInputClass as inputClass } from './AuthCard'

export function CustomerAuthForm({
  register = false,
  destination = '/cuenta',
  notice,
}: {
  register?: boolean
  destination?: '/cuenta' | '/checkout'
  notice?: string
}) {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [mismatch, setMismatch] = useState(false)

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
    if (register && password !== String(form.get('confirmPassword') ?? '')) {
      setMessage('Las contraseñas no coinciden. Volvé a escribirlas.')
      setMismatch(true)
      return
    }
    setSubmitting(true)
    setMessage('')
    setMismatch(false)
    try {
      const result = register
        ? await authClient.signUp.email({ email, password, name })
        : await authClient.signIn.email({ email, password })
      const verifyUrl = `/verificar-email${destination === '/checkout' ? '?next=/checkout' : ''}`
      if (!register && isEmailNotVerified(result.error)) {
        // La contraseña era correcta pero falta verificar el email: el servidor ya envió un código.
        savePendingEmail(email)
        router.replace(verifyUrl)
        return
      }
      if (result.error) {
        setMessage(authFailureMessage(register ? 'signUp' : 'signIn', result.error.status))
        return
      }
      if (register) {
        // El registro no envía el código por sí mismo (ver auth.ts): se pide apenas termina. La
        // respuesta es la misma para un email nuevo o existente, así no se revela cuál es.
        savePendingEmail(email)
        await authClient.emailOtp.sendVerificationOtp({ email, type: 'email-verification' })
        router.replace(verifyUrl)
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
    <AuthCard
      title={register ? 'Creá tu cuenta' : 'Bienvenido de nuevo'}
      subtitle={
        register
          ? 'Guardá tus datos y direcciones en un solo lugar.'
          : 'Ingresá para ver tu perfil y tus direcciones.'
      }
    >
      {notice && (
        <p role="status" className="mt-4 rounded-lg bg-brand-600/10 p-3 text-sm">
          {notice}
        </p>
      )}
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
            {!register && (
              <Link
                href="/olvide-contrasena"
                className="mt-3 inline-block text-sm font-medium text-brand-600 underline-offset-4 hover:underline dark:text-brand-400"
              >
                ¿Olvidaste tu contraseña?
              </Link>
            )}
          </div>
          {register && (
            <div>
              <label htmlFor="customer-password-confirm" className="block text-sm font-medium">
                Confirmar contraseña
              </label>
              <input
                id="customer-password-confirm"
                name="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                required
                minLength={8}
                maxLength={128}
                aria-invalid={mismatch}
                onChange={() => setMismatch(false)}
                className={`${inputClass} mt-2`}
              />
            </div>
          )}
        </fieldset>
        {message && (
          <p role="alert" className="text-sm text-red-600 dark:text-red-400">
            {message}
          </p>
        )}
        <button type="submit" disabled={submitting} className={authButtonClass}>
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
    </AuthCard>
  )
}
