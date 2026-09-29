'use client'

import { Check, ShoppingCart, SpinnerGap } from '@phosphor-icons/react'
import { useState } from 'react'
import { fetchCartProducts, quantityLimit } from '@/lib/cart/model'
import { addToCart, showCartNotice, useCart } from '@/lib/cart/store'

export function AddToCartButton({
  productId,
  name,
  stock,
  compact = false,
  active = true,
}: {
  productId: number
  name: string
  stock: number
  compact?: boolean
  active?: boolean
}) {
  const { ready, items } = useCart()
  const [pending, setPending] = useState(false)
  const [message, setMessage] = useState('')
  const [added, setAdded] = useState(false)
  const quantity = items.find((item) => item.productId === productId)?.quantity ?? 0
  const soldOut = !active || quantityLimit(stock) === 0
  const atLimit = quantity >= quantityLimit(stock)
  function report(text: string, success = false) {
    setMessage(text)
    setAdded(success)
    if (compact) showCartNotice(success ? `${name} agregado al carrito.` : text, !success)
  }
  async function add() {
    setPending(true)
    setMessage('')
    setAdded(false)
    try {
      const [product] = await fetchCartProducts([productId])
      if (!product || product.stock < 1) {
        report('Este producto ya no está disponible.')
        return
      }
      if (!addToCart(productId, product.stock)) {
        report(
          quantity >= quantityLimit(product.stock)
            ? 'Ya agregaste todas las unidades disponibles.'
            : 'El carrito llegó al límite de productos.',
        )
        return
      }
      report('Agregado al carrito.', true)
    } catch {
      report('No se pudo agregar. Intentá nuevamente.')
    } finally {
      setPending(false)
    }
  }
  const label = pending
    ? 'Agregando…'
    : soldOut
      ? 'Sin stock'
      : atLimit
        ? 'Máximo agregado'
        : 'Agregar al carrito'
  const Icon = pending ? SpinnerGap : added ? Check : ShoppingCart
  return (
    <div className={compact ? 'relative shrink-0' : ''}>
      <button
        type="button"
        disabled={!ready || pending || soldOut || atLimit}
        onClick={add}
        aria-label={compact ? `${label}: ${name}` : undefined}
        title={compact ? `${label}: ${name}` : undefined}
        className={
          compact
            ? 'flex h-9 w-9 items-center justify-center rounded-full bg-brand-600 text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-40'
            : 'flex w-full items-center justify-center gap-2 rounded-full bg-brand-600 px-5 py-3 text-base font-semibold text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50'
        }
      >
        <Icon
          size={compact ? 16 : 20}
          weight="bold"
          className={pending ? 'animate-spin motion-reduce:animate-none' : ''}
        />
        {!compact && label}
      </button>
      {!compact && (
        <span
          role="status"
          className={`mt-2 block min-h-5 text-sm ${added ? 'text-brand-600 dark:text-brand-400' : 'text-red-600 dark:text-red-400'}`}
        >
          {message}
        </span>
      )}
    </div>
  )
}
