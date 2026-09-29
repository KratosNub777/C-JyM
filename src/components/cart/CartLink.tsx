'use client'

import { ShoppingCart } from '@phosphor-icons/react'
import Link from 'next/link'
import { useCart } from '@/lib/cart/store'

export function CartLink() {
  const { items } = useCart()
  const count = items.reduce((sum, item) => sum + item.quantity, 0)
  return (
    <Link
      href="/carrito"
      aria-label={`Carrito, ${count} ${count === 1 ? 'producto' : 'productos'}`}
      className="relative flex h-10 w-10 items-center justify-center rounded-full text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-white"
    >
      <ShoppingCart size={22} weight="regular" />
      <span
        aria-hidden="true"
        className="absolute right-0 top-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-600 px-1 text-[10px] font-semibold text-white"
      >
        {count > 99 ? '99+' : count}
      </span>
    </Link>
  )
}
