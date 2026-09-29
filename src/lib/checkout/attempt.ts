'use client'

import { useCallback, useSyncExternalStore } from 'react'
import { parseCheckout, type CheckoutInput } from './model'

const memory = new Map<string, string | null>()
const eventName = 'checkout-attempt-changed'
const keyFor = (customerId: string) => `c-jym.checkout.v1:${customerId}`

function read(key: string) {
  if (memory.has(key)) return memory.get(key) ?? null
  try {
    return window.sessionStorage.getItem(key)
  } catch {
    return memory.get(key) ?? null
  }
}
function subscribe(listener: () => void) {
  window.addEventListener(eventName, listener)
  window.addEventListener('storage', listener)
  return () => {
    window.removeEventListener(eventName, listener)
    window.removeEventListener('storage', listener)
  }
}

// A lost response keeps the exact request for a retry, even after a tab reload.
export function useCheckoutAttempt(customerId: string) {
  const key = keyFor(customerId)
  const getSnapshot = useCallback(() => read(key), [key])
  const stored = useSyncExternalStore(subscribe, getSnapshot, () => null)
  if (!stored || stored.length > 40000) return null
  try {
    return parseCheckout(JSON.parse(stored))
  } catch {
    return null
  }
}

export function saveCheckoutAttempt(customerId: string, input: CheckoutInput | null) {
  const key = keyFor(customerId)
  const value = input ? JSON.stringify(input) : null
  memory.set(key, value)
  try {
    if (value) window.sessionStorage.setItem(key, value)
    else window.sessionStorage.removeItem(key)
  } catch {
    /* Keep the attempt in memory if storage is blocked. */
  }
  window.dispatchEvent(new Event(eventName))
}
