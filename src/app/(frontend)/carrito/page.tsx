import type { Metadata } from 'next'
import { CartContents } from '@/components/cart/CartContents'

export const metadata: Metadata = { title: 'Mi carrito', robots: { index: false, follow: false } }

export default function CartPage() {
  return <CartContents />
}
