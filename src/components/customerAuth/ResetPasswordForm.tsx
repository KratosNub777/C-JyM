'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState, type FormEvent } from 'react'
import { authClient } from '@/lib/customerAuth/client'
import { codeFailureMessage } from '@/lib/customerAuth/errors'
import { clearPendingEmail, usePendingEmail } from '@/lib/customerAuth/pendingEmail'
import { AuthCard, authButtonClass, authInputClass } from './AuthCard'

const RESEND_SECONDS = 60

export function ResetPasswordForm() {
  const router = useRouter()
  const pendingEmail = usePendingEmail()
  const [typedEmail, setTypedEmail] = useState('')
  const askEmail = !pendingEmail
  const email = pendingEmail || typedEmail
  const [code, setCode] = useState('')
  const [message, setMessage] = useState('')
  const [info, setInfo] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [cooldown, setCooldown] = useState(0)
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    if (cooldown <= 0) return
    const timer = setTimeout(() => setCooldown((seconds) => seconds - 1), 1000)
    return () => clearTimeout(timer)
  }, [cooldown])

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const password = String(form.get('password') ?? '')
    setInfo('')
    if (password !== String(form.get('confirmPassword') ?? '')) {
      setMessage('Las contraseñas no coinciden. Volvé a escribirlas.')
      return
    }
    setMessage('')
    setSubmitting(true)
    try {
      const result = await authClient.emailOtp.resetPassword({
        email: email.trim(),
        otp: code,
        password,
      })
      if (result.error) {
        setMessage(codeFailureMessage(result.error))
        return
      }
      clearPendingEmail()
      router.replace('/ingresar?restablecida=1')
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
      const result = await authClient.emailOtp.requestPasswordReset({ email: email.trim() })
      if (result.error && result.error.status !== 400) {
        setMessage(codeFailureMessage(result.error))
        return
      }
      setCode('')
      setCooldown(RESEND_SECONDS)
      setInfo(
        'Si el email tiene una cuenta, te enviamos un código nuevo. Revisá el correo no deseado.',
      )
    } catch {
      setMessage('No pudimos conectarnos. Intentá nuevamente.')
    }
  }

  const passwordType = showPassword ? 'text' : 'password'
  return (
    <AuthCard
      title="Elegí una contraseña nueva"
      subtitle="Ingresá el código de 6 dígitos que te enviamos. Vence en 5 minutos."
    >
      <form onSubmit={submit} className="mt-7 space-y-5" aria-busy={submitting}>
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
          <div>
            <label htmlFor="new-password" className="block text-sm font-medium">
              Contraseña nueva
            </label>
            <div className="relative mt-2">
              <input
                id="new-password"
                name="password"
                type={passwordType}
                autoComplete="new-password"
                required
                minLength={8}
                maxLength={128}
                className={`${authInputClass} pr-24`}
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
            <p className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">
              Usá entre 8 y 128 caracteres.
            </p>
          </div>
          <div>
            <label htmlFor="new-password-confirm" className="block text-sm font-medium">
              Confirmar contraseña
            </label>
            <input
              id="new-password-confirm"
              name="confirmPassword"
              type={passwordType}
              autoComplete="new-password"
              required
              minLength={8}
              maxLength={128}
              className={`${authInputClass} mt-2`}
            />
          </div>
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
          {submitting ? 'Un momento…' : 'Cambiar contraseña'}
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
        <Link href="/ingresar" className="text-neutral-500 dark:text-neutral-400">
          Volver a ingresar
        </Link>
      </div>
    </AuthCard>
  )
}
