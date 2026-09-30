'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, type FormEvent } from 'react'
import { authClient } from '@/lib/customerAuth/client'
import { codeFailureMessage } from '@/lib/customerAuth/errors'
import { savePendingEmail } from '@/lib/customerAuth/pendingEmail'
import { AuthCard, authButtonClass, authInputClass } from './AuthCard'

export function ForgotPasswordForm() {
  const router = useRouter()
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const email = String(new FormData(event.currentTarget).get('email') ?? '').trim()
    setMessage('')
    setSubmitting(true)
    try {
      const result = await authClient.emailOtp.requestPasswordReset({ email })
      // El servidor responde igual exista o no la cuenta, y esta pantalla también: solo se muestran
      // los límites de intentos y los fallos del servicio.
      if (result.error && result.error.status !== 400) {
        setMessage(codeFailureMessage(result.error))
        return
      }
      savePendingEmail(email)
      router.push('/restablecer-contrasena')
    } catch {
      setMessage('No pudimos conectarnos. Intentá nuevamente.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthCard
      title="Recuperá tu contraseña"
      subtitle="Escribí tu email. Si tiene una cuenta, te enviamos un código de 6 dígitos."
    >
      <form onSubmit={submit} className="mt-7 space-y-5" aria-busy={submitting}>
        <fieldset disabled={submitting} className="space-y-5">
          <label className="block text-sm font-medium">
            Email
            <input
              name="email"
              type="email"
              autoComplete="email"
              required
              maxLength={254}
              className={`${authInputClass} mt-2`}
            />
          </label>
        </fieldset>
        {message && (
          <p role="alert" className="text-sm text-red-600 dark:text-red-400">
            {message}
          </p>
        )}
        <button type="submit" disabled={submitting} className={authButtonClass}>
          {submitting ? 'Un momento…' : 'Enviar código'}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-neutral-500 dark:text-neutral-400">
        <Link
          href="/ingresar"
          className="font-semibold text-brand-600 underline-offset-4 hover:underline dark:text-brand-400"
        >
          Volver a ingresar
        </Link>
      </p>
    </AuthCard>
  )
}
