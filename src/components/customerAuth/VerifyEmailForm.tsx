'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState, type FormEvent } from 'react'
import { authClient } from '@/lib/customerAuth/client'
import { codeFailureMessage } from '@/lib/customerAuth/errors'
import { clearPendingEmail, usePendingEmail } from '@/lib/customerAuth/pendingEmail'
import { AuthCard, authButtonClass, authInputClass } from './AuthCard'

const RESEND_SECONDS = 60

export function VerifyEmailForm({ destination }: { destination: '/cuenta' | '/checkout' }) {
  const router = useRouter()
  const pendingEmail = usePendingEmail()
  const [typedEmail, setTypedEmail] = useState('')
  // Si no hay un email guardado (almacenamiento bloqueado o pantalla abierta directamente), se pide.
  const askEmail = !pendingEmail
  const email = pendingEmail || typedEmail
  const [code, setCode] = useState('')
  const [message, setMessage] = useState('')
  const [info, setInfo] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [cooldown, setCooldown] = useState(0)

  useEffect(() => {
    if (cooldown <= 0) return
    const timer = setTimeout(() => setCooldown((seconds) => seconds - 1), 1000)
    return () => clearTimeout(timer)
  }, [cooldown])

  async function verify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage('')
    setInfo('')
    setSubmitting(true)
    try {
      const result = await authClient.emailOtp.verifyEmail({ email: email.trim(), otp: code })
      if (result.error) {
        setMessage(codeFailureMessage(result.error))
        return
      }
      clearPendingEmail()
      router.replace(destination)
      router.refresh()
    } catch {
      setMessage('No pudimos conectarnos. Intentá nuevamente.')
    } finally {
      setSubmitting(false)
    }
  }

  async function resend() {
    setMessage('')
    setInfo('')
    try {
      const result = await authClient.emailOtp.sendVerificationOtp({
        email: email.trim(),
        type: 'email-verification',
      })
      if (result.error) {
        setMessage(codeFailureMessage(result.error))
        return
      }
      setCode('')
      setCooldown(RESEND_SECONDS)
      setInfo(
        'Si el email es correcto, te enviamos el código otra vez. Revisá también el correo no deseado.',
      )
    } catch {
      setMessage('No pudimos conectarnos. Intentá nuevamente.')
    }
  }

  return (
    <AuthCard
      title="Verificá tu email"
      subtitle={
        askEmail
          ? 'Escribí tu email y el código de 6 dígitos que te enviamos.'
          : 'Te enviamos un código de 6 dígitos. Vence en 5 minutos.'
      }
    >
      <form onSubmit={verify} className="mt-7 space-y-5" aria-busy={submitting}>
        <fieldset disabled={submitting} className="space-y-5">
          {askEmail ? (
            <label className="block text-sm font-medium">
              Email
              <input
                type="email"
                autoComplete="email"
                required
                maxLength={254}
                value={email}
                onChange={(event) => setTypedEmail(event.target.value)}
                className={`${authInputClass} mt-2`}
              />
            </label>
          ) : (
            <p className="break-all text-sm">
              Enviado a <span className="font-semibold">{email}</span>
            </p>
          )}
          <label className="block text-sm font-medium">
            Código de verificación
            <input
              name="code"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="\d{6}"
              maxLength={6}
              required
              value={code}
              onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
              className={`${authInputClass} mt-2 text-center text-2xl tracking-[0.5em]`}
            />
          </label>
        </fieldset>
        {message && (
          <p role="alert" className="text-sm text-red-600 dark:text-red-400">
            {message}
          </p>
        )}
        {info && (
          <p role="status" className="text-sm text-neutral-600 dark:text-neutral-300">
            {info}
          </p>
        )}
        <button
          type="submit"
          disabled={submitting || code.length !== 6}
          className={authButtonClass}
        >
          {submitting ? 'Un momento…' : 'Verificar'}
        </button>
      </form>
      <div className="mt-6 flex flex-col items-center gap-2 text-sm">
        <button
          type="button"
          onClick={resend}
          disabled={cooldown > 0 || !email.trim() || submitting}
          className="font-semibold text-brand-600 underline-offset-4 hover:underline disabled:opacity-50 dark:text-brand-400"
        >
          {cooldown > 0 ? `Reenviar código en ${cooldown} s` : 'Reenviar código'}
        </button>
        <Link href="/registrarse" className="text-neutral-500 dark:text-neutral-400">
          Usar otro email
        </Link>
      </div>
    </AuthCard>
  )
}
