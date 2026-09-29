'use client'

import { CheckCircle, X } from '@phosphor-icons/react'
import Link from 'next/link'
import { useEffect } from 'react'
import { dismissCartNotice, useCart } from '@/lib/cart/store'

export function CartFeedback() {
  const { notice } = useCart()
  useEffect(() => {
    if (!notice) return
    const timeout = window.setTimeout(() => dismissCartNotice(notice), 6_000)
    return () => window.clearTimeout(timeout)
  }, [notice])
  if (!notice) return null
  return (
    <div className="fixed bottom-5 left-4 right-4 z-50 flex items-start gap-3 rounded-xl border border-neutral-200 bg-white p-4 shadow-lg sm:left-auto sm:right-6 sm:max-w-sm dark:border-neutral-700 dark:bg-neutral-900">
      {!notice.error && <CheckCircle size={22} weight="fill" className="shrink-0 text-brand-600" />}
      <div className="min-w-0 flex-1">
        <p role={notice.error ? 'alert' : 'status'} className="text-sm">
          {notice.message}
        </p>
        {!notice.error && (
          <Link
            href="/carrito"
            onClick={() => dismissCartNotice()}
            className="mt-2 inline-block text-sm font-semibold text-brand-600 hover:underline dark:text-brand-400"
          >
            Ver carrito →
          </Link>
        )}
      </div>
      <button
        type="button"
        onClick={() => dismissCartNotice()}
        aria-label="Cerrar aviso del carrito"
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800"
      >
        <X size={16} />
      </button>
    </div>
  )
}
