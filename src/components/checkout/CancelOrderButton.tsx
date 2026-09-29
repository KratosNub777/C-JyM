'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { cancelOrder } from '@/lib/checkout/actions'

export function CancelOrderButton({ orderId }: { orderId: number }) {
  const router = useRouter()
  const [confirm, setConfirm] = useState(false)
  const [pending, setPending] = useState(false)
  const [message, setMessage] = useState('')
  async function cancel() {
    setPending(true)
    setMessage('')
    try {
      const result = await cancelOrder(orderId)
      if (result.ok) {
        router.refresh()
        setConfirm(false)
      } else setMessage(result.message)
    } catch {
      setMessage('No pudimos cancelar el pedido. Intentá nuevamente.')
    } finally {
      setPending(false)
    }
  }
  return (
    <div className="mt-6 text-sm">
      {confirm ? (
        <>
          <p>¿Cancelar este pedido y liberar el stock reservado?</p>
          <div className="mt-3 flex gap-4">
            <button
              onClick={cancel}
              disabled={pending}
              className="rounded-full bg-red-600 px-5 py-2.5 font-semibold text-white disabled:opacity-50"
            >
              {pending ? 'Cancelando…' : 'Sí, cancelar pedido'}
            </button>
            <button disabled={pending} onClick={() => setConfirm(false)} className="font-semibold">
              Volver
            </button>
          </div>
        </>
      ) : (
        <button
          onClick={() => setConfirm(true)}
          className="font-semibold text-red-600 dark:text-red-400"
        >
          Cancelar pedido
        </button>
      )}
      {message && (
        <p role="alert" className="mt-3 text-red-600 dark:text-red-400">
          {message}
        </p>
      )}
    </div>
  )
}
