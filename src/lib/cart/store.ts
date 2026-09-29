'use client'

import { useSyncExternalStore } from 'react'
import {
  CART_STORAGE_KEY,
  MAX_CART_ITEMS,
  isProductId,
  parseStoredCart,
  quantityLimit,
  type CartItem,
} from './model'

type CartNotice = { message: string; error: boolean }
type CartSnapshot = {
  items: CartItem[]
  ready: boolean
  persistent: boolean
  notice: CartNotice | null
}
const initial: CartSnapshot = { items: [], ready: false, persistent: true, notice: null }
let snapshot = initial
const listeners = new Set<() => void>()

function notify() {
  for (const listener of listeners) listener()
}
function readStorage() {
  // If writes are blocked, retain the in-memory cart instead of rereading an empty store.
  if (snapshot.ready && !snapshot.persistent) return
  let items = snapshot.items
  let persistent = true
  try {
    items = parseStoredCart(window.localStorage.getItem(CART_STORAGE_KEY))
  } catch {
    persistent = false
  }
  if (
    !snapshot.ready ||
    persistent !== snapshot.persistent ||
    JSON.stringify(items) !== JSON.stringify(snapshot.items)
  ) {
    snapshot = { ...snapshot, items, ready: true, persistent }
    notify()
  }
}
function onStorage(event: StorageEvent) {
  if (event.key === CART_STORAGE_KEY || event.key === null) readStorage()
}
function subscribe(listener: () => void) {
  listeners.add(listener)
  if (listeners.size === 1) {
    window.addEventListener('storage', onStorage)
    window.addEventListener('focus', readStorage)
  }
  readStorage()
  return () => {
    listeners.delete(listener)
    if (!listeners.size) {
      window.removeEventListener('storage', onStorage)
      window.removeEventListener('focus', readStorage)
    }
  }
}
function save(items: CartItem[]) {
  let persistent = true
  try {
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify({ version: 1, items }))
  } catch {
    persistent = false
  }
  snapshot = { ...snapshot, items, ready: true, persistent }
  notify()
}

export function useCart() {
  return useSyncExternalStore(
    subscribe,
    () => snapshot,
    () => initial,
  )
}

export function addToCart(productId: number, stock: number): boolean {
  readStorage()
  const limit = quantityLimit(stock)
  if (!isProductId(productId) || !limit) return false
  const existing = snapshot.items.find((item) => item.productId === productId)
  if (existing && existing.quantity >= limit) return false
  if (!existing && snapshot.items.length >= MAX_CART_ITEMS) return false
  save(
    existing
      ? snapshot.items.map((item) =>
          item.productId === productId ? { ...item, quantity: item.quantity + 1 } : item,
        )
      : [...snapshot.items, { productId, quantity: 1 }],
  )
  return true
}

export function setCartQuantity(productId: number, quantity: number, stock: number) {
  readStorage()
  if (!Number.isSafeInteger(quantity) || quantity < 1) return
  const limit = quantityLimit(stock)
  if (!limit) return
  save(
    snapshot.items.map((item) =>
      item.productId === productId ? { ...item, quantity: Math.min(quantity, limit) } : item,
    ),
  )
}

export function removeFromCart(productId: number) {
  readStorage()
  save(snapshot.items.filter((item) => item.productId !== productId))
}

export function clearCart() {
  save([])
}

export function showCartNotice(message: string, error = false) {
  snapshot = { ...snapshot, notice: { message, error } }
  notify()
}

export function dismissCartNotice(notice?: CartNotice) {
  if (notice && snapshot.notice !== notice) return
  snapshot = { ...snapshot, notice: null }
  notify()
}
