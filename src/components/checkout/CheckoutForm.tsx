'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState, type FormEvent } from 'react'
import { fetchCartProducts, quantityLimit, type CartProduct } from '@/lib/cart/model'
import { consumeCartItems, useCart } from '@/lib/cart/store'
import { placeOrder } from '@/lib/checkout/actions'
import { saveCheckoutAttempt, useCheckoutAttempt } from '@/lib/checkout/attempt'
import { formatGs } from '@/lib/format'

const panel =
  'rounded-2xl border border-neutral-200 bg-white p-5 sm:p-7 dark:border-neutral-800 dark:bg-neutral-900/40'
const inputClass =
  'mt-2 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-base outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20 dark:border-neutral-700 dark:bg-neutral-900'

export function CheckoutForm({
  customerId,
  name,
  email,
  phone,
  reservationHours,
}: {
  customerId: string
  name: string
  email: string
  phone: string
  reservationHours: number
}) {
  const router = useRouter()
  const { items, ready } = useCart()
  const attempt = useCheckoutAttempt(customerId)
  const [refresh, setRefresh] = useState(0)
  const [pending, setPending] = useState(false)
  const [message, setMessage] = useState('')
  const [loaded, setLoaded] = useState<{ key: string; products: CartProduct[]; error: boolean }>({
    key: '',
    products: [],
    error: false,
  })
  const ids = items
    .map((item) => item.productId)
    .sort((a, b) => a - b)
    .join(',')
  const requestKey = `${ids}:${refresh}`
  useEffect(() => {
    if (!ids) return
    const controller = new AbortController()
    fetchCartProducts(ids.split(',').map(Number), controller.signal)
      .then((products) => {
        if (!controller.signal.aborted) setLoaded({ key: requestKey, products, error: false })
      })
      .catch(() => {
        if (!controller.signal.aborted) setLoaded({ key: requestKey, products: [], error: true })
      })
    return () => controller.abort()
  }, [ids, requestKey])
  const loading = !ready || (!!items.length && loaded.key !== requestKey)
  const products = new Map(loaded.products.map((product) => [product.id, product]))
  const unavailable = items.some(
    (item) =>
      !products.has(item.productId) ||
      item.quantity > quantityLimit(products.get(item.productId)?.stock ?? 0),
  )
  const total = items.reduce(
    (sum, item) => sum + (products.get(item.productId)?.price ?? 0) * item.quantity,
    0,
  )
  const displayItems =
    attempt?.items ??
    items.map((item) => ({ ...item, expectedPrice: products.get(item.productId)?.price ?? 0 }))

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (pending || (!attempt && (loading || loaded.error || unavailable || !items.length))) return
    const form = new FormData(event.currentTarget)
    const input = attempt ?? {
      requestId: crypto.randomUUID(),
      customerName: String(form.get('customerName') ?? ''),
      phone: String(form.get('phone') ?? ''),
      notes: String(form.get('notes') ?? ''),
      items: items.map((item) => ({ ...item, expectedPrice: products.get(item.productId)!.price })),
    }
    saveCheckoutAttempt(customerId, input)
    setPending(true)
    setMessage('')
    try {
      const result = await placeOrder(input)
      if (result.ok) {
        consumeCartItems(input.items)
        saveCheckoutAttempt(customerId, null)
        router.replace(`/cuenta/pedidos/${result.orderId}`)
        router.refresh()
        return
      }
      setMessage(result.message)
      if (result.code === 'AUTH') {
        router.push('/ingresar?next=/checkout')
        return
      }
      if (result.code !== 'FAILED') saveCheckoutAttempt(customerId, null)
      if (result.code === 'PRICES_CHANGED' || result.code === 'STOCK')
        setRefresh((value) => value + 1)
    } catch {
      setMessage('No recibimos la confirmación. Reintentá para verificar este mismo pedido.')
    } finally {
      setPending(false)
    }
  }

  if (loading && !attempt && !loaded.key)
    return (
      <p role="status" className="py-10">
        Cargando tu pedido…
      </p>
    )
  if (!items.length && !attempt)
    return (
      <section className={`${panel} mx-auto max-w-xl text-center`}>
        <h1 className="text-2xl font-semibold">Tu carrito está vacío</h1>
        <Link href="/productos" className="mt-5 inline-block font-semibold text-brand-600">
          Ver productos →
        </Link>
      </section>
    )

  return (
    <div className="mx-auto max-w-5xl">
      <Link href="/carrito" className="text-sm font-semibold text-brand-600 dark:text-brand-400">
        ← Volver al carrito
      </Link>
      <h1 className="mt-4 text-3xl font-semibold tracking-tight">Confirmar pedido</h1>
      <p className="mt-3 text-neutral-500 dark:text-neutral-400">
        Retiro en el local · Pendiente de pago
      </p>
      <form
        onSubmit={submit}
        className="mt-7 grid items-start gap-6 lg:grid-cols-[1fr_340px]"
        aria-busy={pending}
      >
        <div className="space-y-5">
          {attempt && (
            <p
              role="status"
              className="rounded-xl bg-amber-50 p-4 text-sm text-amber-900 dark:bg-amber-950/40 dark:text-amber-200"
            >
              Hay un intento pendiente de verificar. Reintentá con los mismos datos para evitar un
              pedido duplicado.
            </p>
          )}
          <fieldset disabled={pending || !!attempt} className={panel}>
            <legend className="sr-only">Datos de contacto</legend>
            <h2 className="text-lg font-semibold">Datos de contacto</h2>
            <label className="mt-5 block text-sm font-medium">
              Nombre completo
              <input
                name="customerName"
                defaultValue={attempt?.customerName ?? name}
                required
                maxLength={120}
                autoComplete="name"
                className={inputClass}
              />
            </label>
            <label className="mt-5 block text-sm font-medium">
              Teléfono
              <input
                name="phone"
                defaultValue={attempt?.phone ?? phone}
                required
                maxLength={30}
                minLength={6}
                type="tel"
                autoComplete="tel"
                className={inputClass}
              />
            </label>
            <p className="mt-5 break-all text-sm text-neutral-500 dark:text-neutral-400">
              Email de tu cuenta: {email}
            </p>
            <label className="mt-5 block text-sm font-medium">
              Observaciones (opcional)
              <textarea
                name="notes"
                defaultValue={attempt?.notes ?? ''}
                maxLength={500}
                rows={3}
                className={inputClass}
              />
            </label>
          </fieldset>
          <section className={panel}>
            <h2 className="text-lg font-semibold">Retiro en el local</h2>
            <p className="mt-3 text-sm text-neutral-500 dark:text-neutral-400">
              El pedido queda pendiente de pago. Coordiná el pago y el retiro con Comercial José
              María antes de acercarte al local.
            </p>
            <p className="mt-3 text-sm text-neutral-500 dark:text-neutral-400">
              Al confirmar reservamos el stock durante {reservationHours} horas. Si no se paga a
              tiempo, el pedido vence y se libera el stock. También podés cancelar desde tu cuenta.
            </p>
          </section>
        </div>
        <section className={panel} aria-label="Resumen del pedido">
          <h2 className="text-lg font-semibold">Tu pedido</h2>
          {loaded.error && !attempt ? (
            <p role="alert" className="mt-4 text-sm text-red-600">
              No pudimos consultar precios y stock.{' '}
              <button
                type="button"
                className="underline"
                onClick={() => setRefresh((value) => value + 1)}
              >
                Reintentar consulta
              </button>
            </p>
          ) : (
            <ul className="mt-5 space-y-4 text-sm">
              {displayItems.map((item) => {
                const product = products.get(item.productId)
                return (
                  <li key={item.productId} className="flex gap-3">
                    <span className="min-w-0 flex-1">
                      {product?.name ?? `Producto #${item.productId}`}
                      <span className="mt-1 block text-neutral-500">
                        {item.quantity} × {formatGs(item.expectedPrice)}
                      </span>
                    </span>
                    <span className="shrink-0 font-medium tabular-nums">
                      {formatGs(item.expectedPrice * item.quantity)}
                    </span>
                  </li>
                )
              })}
            </ul>
          )}
          <dl className="mt-6 space-y-3 border-t border-neutral-200 pt-5 dark:border-neutral-800">
            <div className="flex justify-between text-sm">
              <dt>Retiro en el local</dt>
              <dd>Sin costo</dd>
            </div>
            <div className="flex justify-between text-lg font-semibold">
              <dt>Total</dt>
              <dd className="tabular-nums">
                {formatGs(
                  attempt
                    ? attempt.items.reduce(
                        (sum, item) => sum + item.expectedPrice * item.quantity,
                        0,
                      )
                    : total,
                )}
              </dd>
            </div>
          </dl>
          {unavailable && !attempt && !loading && !loaded.error && (
            <p role="alert" className="mt-4 text-sm text-red-600 dark:text-red-400">
              Revisá los productos sin stock o las cantidades en tu carrito antes de confirmar.
            </p>
          )}
          {message && (
            <p role="alert" className="mt-4 text-sm text-red-600 dark:text-red-400">
              {message}
            </p>
          )}
          <button
            type="submit"
            disabled={pending || (!attempt && (loading || loaded.error || unavailable))}
            className="mt-6 w-full rounded-full bg-brand-600 px-4 py-3 font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
          >
            {pending ? 'Confirmando…' : attempt ? 'Verificar mi pedido' : 'Confirmar pedido'}
          </button>
          <p className="mt-3 text-center text-xs text-neutral-500 dark:text-neutral-400">
            No se realizará ningún cobro online.
          </p>
        </section>
      </form>
    </div>
  )
}
