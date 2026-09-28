'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { authClient } from '@/lib/customerAuth/client'

export function SignOutButton({ className = '' }: { className?: string }) {
  const router = useRouter()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState(false)
  async function signOut() {
    setPending(true)
    setError(false)
    try {
      const result = await authClient.signOut()
      if (result.error) throw new Error('Sign out failed')
      router.replace('/ingresar')
      router.refresh()
    } catch {
      setError(true)
    } finally {
      setPending(false)
    }
  }
  return (
    <div>
      <button
        type="button"
        onClick={signOut}
        disabled={pending}
        className={`${className} disabled:opacity-50`}
      >
        {pending ? 'Cerrando sesión…' : 'Cerrar sesión'}
      </button>
      {error && (
        <p role="alert" className="px-3 py-2 text-sm text-red-600">
          No se pudo cerrar la sesión. Intentá de nuevo.
        </p>
      )}
    </div>
  )
}
