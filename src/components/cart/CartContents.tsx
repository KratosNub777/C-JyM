'use client'

import { ImageSquare, Minus, Plus, ShoppingCart, Trash } from '@phosphor-icons/react'
import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { fetchCartProducts, quantityLimit, type CartProduct } from '@/lib/cart/model'
import { clearCart, removeFromCart, setCartQuantity, useCart } from '@/lib/cart/store'
import { formatGs } from '@/lib/format'

export function CartContents() {
  const { items, ready, persistent } = useCart()
  const [refresh, setRefresh] = useState(0)
  const [confirmClear, setConfirmClear] = useState(false)
  const [loaded, setLoaded] = useState<{ key: string; products: CartProduct[]; error: boolean }>({
    key: '',
    products: [],
    error: false,
  })
  const idsKey = items
    .map((item) => item.productId)
    .sort((a, b) => a - b)
    .join(',')
  const requestKey = `${idsKey}:${refresh}`

  useEffect(() => {
    if (!idsKey) return
    const controller = new AbortController()
    fetchCartProducts(idsKey.split(',').map(Number), controller.signal)
      .then((products) => {
        if (!controller.signal.aborted) setLoaded({ key: requestKey, products, error: false })
      })
      .catch(() => {
        if (!controller.signal.aborted) setLoaded({ key: requestKey, products: [], error: true })
      })
    return () => controller.abort()
  }, [idsKey, requestKey])

  useEffect(() => {
    function refreshProducts() {
      setRefresh((value) => value + 1)
    }
    window.addEventListener('focus', refreshProducts)
    return () => window.removeEventListener('focus', refreshProducts)
  }, [])

  const loading = !ready || (!!items.length && loaded.key !== requestKey)
  const products = new Map(loaded.products.map((product) => [product.id, product]))
  const count = items.reduce((sum, item) => sum + item.quantity, 0)
  const hasUnavailable = items.some((item) => {
    const product = products.get(item.productId)
    return !product || item.quantity > quantityLimit(product.stock)
  })
  const total = items.reduce((sum, item) => {
    const product = products.get(item.productId)
    return product && product.stock > 0 ? sum + product.price * item.quantity : sum
  }, 0)

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-semibold tracking-tight">Mi carrito</h1>
        <Link
          href="/productos"
          className="text-sm font-semibold text-brand-600 hover:underline dark:text-brand-400"
        >
          Seguir viendo productos →
        </Link>
      </div>
      {!persistent && (
        <p
          role="status"
          className="mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-950/40 dark:text-amber-200"
        >
          El navegador no permite guardar el carrito. Los cambios se conservarán mientras esta
          página siga abierta.
        </p>
      )}

      {loading ? (
        <div
          aria-busy="true"
          role="status"
          className="mt-8 rounded-2xl border border-neutral-200 bg-white p-8 text-neutral-500 dark:border-neutral-800 dark:bg-neutral-900"
        >
          Cargando tu carrito…
        </div>
      ) : !items.length ? (
        <div className="mt-8 flex flex-col items-center rounded-2xl border border-neutral-200 bg-white px-6 py-16 text-center dark:border-neutral-800 dark:bg-neutral-900/40">
          <ShoppingCart size={48} weight="light" className="text-neutral-400" />
          <h2 className="mt-5 text-xl font-semibold">Tu carrito está vacío</h2>
          <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
            Encontrá lo que necesitás para tu hogar y agregalo acá.
          </p>
          <Link
            href="/productos"
            className="mt-6 rounded-full bg-brand-600 px-6 py-3 font-semibold text-white hover:bg-brand-700"
          >
            Ver productos
          </Link>
        </div>
      ) : loaded.error ? (
        <div
          role="alert"
          className="mt-8 rounded-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900"
        >
          <p>No pudimos consultar los precios y el stock. Tu carrito sigue guardado.</p>
          <button
            type="button"
            onClick={() => setRefresh((value) => value + 1)}
            className="mt-4 rounded-full bg-brand-600 px-5 py-3 font-semibold text-white hover:bg-brand-700"
          >
            Intentar de nuevo
          </button>
        </div>
      ) : (
        <>
          <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
            {count} {count === 1 ? 'producto' : 'productos'} en tu carrito
          </p>
          <div className="mt-6 grid items-start gap-6 lg:grid-cols-[1fr_320px]">
            <div>
              <ul className="divide-y divide-neutral-200 overflow-hidden rounded-2xl border border-neutral-200 bg-white dark:divide-neutral-800 dark:border-neutral-800 dark:bg-neutral-900/40">
                {items.map((item) => {
                  const product = products.get(item.productId)
                  const limit = quantityLimit(product?.stock ?? 0)
                  const available = !!product && limit > 0
                  const overStock = item.quantity > limit
                  return (
                    <li key={item.productId} className="p-4 sm:p-6">
                      <div className="flex items-start gap-4">
                        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-neutral-100 sm:h-24 sm:w-24 dark:bg-neutral-800">
                          {product?.image ? (
                            <Image
                              src={product.image.url}
                              alt={product.image.alt}
                              fill
                              sizes="96px"
                              className="object-cover"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center text-neutral-400">
                              <ImageSquare size={30} weight="light" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          {product ? (
                            <Link
                              href={`/productos/${product.slug}`}
                              className="text-sm font-semibold leading-snug hover:text-brand-600 sm:text-base"
                            >
                              {product.name}
                            </Link>
                          ) : (
                            <p className="font-semibold">Producto no disponible</p>
                          )}
                          {product && (
                            <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
                              {formatGs(product.price)} por unidad
                            </p>
                          )}
                          {!available && (
                            <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                              {product
                                ? 'Sin stock por el momento.'
                                : 'Este producto ya no está en el catálogo.'}
                            </p>
                          )}
                          {available && overStock && (
                            <p
                              role="status"
                              className="mt-2 text-sm text-amber-700 dark:text-amber-300"
                            >
                              Solo {limit === 1 ? 'queda 1 unidad' : `quedan ${limit} unidades`}.
                              Ajustá la cantidad.
                            </p>
                          )}
                        </div>
                        <button
                          type="button"
                          aria-label={`Quitar ${product?.name ?? 'producto no disponible'} del carrito`}
                          title="Quitar producto"
                          onClick={() => removeFromCart(item.productId)}
                          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-neutral-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40"
                        >
                          <Trash size={20} />
                        </button>
                      </div>
                      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 sm:pl-28">
                        <div
                          className="flex items-center rounded-full border border-neutral-300 dark:border-neutral-700"
                          role="group"
                          aria-label={`Cantidad de ${product?.name ?? 'producto no disponible'}`}
                        >
                          <button
                            type="button"
                            aria-label={`Reducir cantidad de ${product?.name ?? 'producto'}`}
                            disabled={!available || item.quantity <= 1}
                            onClick={() =>
                              setCartQuantity(item.productId, item.quantity - 1, limit)
                            }
                            className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-neutral-100 disabled:opacity-30 dark:hover:bg-neutral-800"
                          >
                            <Minus size={16} weight="bold" />
                          </button>
                          <span
                            aria-label={`${item.quantity} unidades`}
                            className="min-w-9 text-center text-sm font-semibold tabular-nums"
                          >
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            aria-label={`Aumentar cantidad de ${product?.name ?? 'producto'}`}
                            disabled={!available || item.quantity >= limit}
                            onClick={() =>
                              setCartQuantity(item.productId, item.quantity + 1, limit)
                            }
                            className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-neutral-100 disabled:opacity-30 dark:hover:bg-neutral-800"
                          >
                            <Plus size={16} weight="bold" />
                          </button>
                        </div>
                        {available && (
                          <p className="font-semibold tabular-nums">
                            {formatGs(product.price * item.quantity)}
                          </p>
                        )}
                      </div>
                    </li>
                  )
                })}
              </ul>
              <div className="mt-4 flex flex-wrap items-center gap-4 text-sm">
                {confirmClear ? (
                  <>
                    <span>¿Vaciar todo el carrito?</span>
                    <button
                      type="button"
                      onClick={() => {
                        clearCart()
                        setConfirmClear(false)
                      }}
                      className="font-semibold text-red-600 dark:text-red-400"
                    >
                      Sí, vaciar
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmClear(false)}
                      className="font-medium"
                    >
                      Cancelar
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmClear(true)}
                    className="text-neutral-500 hover:text-red-600 dark:text-neutral-400"
                  >
                    Vaciar carrito
                  </button>
                )}
              </div>
            </div>
            <aside
              aria-label="Resumen del carrito"
              className="rounded-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900/40"
            >
              <h2 className="text-lg font-semibold">Resumen</h2>
              <div className="mt-5 flex items-center justify-between gap-3">
                <span className="text-sm text-neutral-500 dark:text-neutral-400">Subtotal</span>
                <span className="text-xl font-semibold tabular-nums">{formatGs(total)}</span>
              </div>
              {hasUnavailable && (
                <p role="status" className="mt-4 text-sm text-amber-700 dark:text-amber-300">
                  Revisá los productos sin disponibilidad y las cantidades antes de continuar.
                </p>
              )}
              <p className="mt-5 border-t border-neutral-200 pt-5 text-sm text-neutral-500 dark:border-neutral-800 dark:text-neutral-400">
                La compra online estará disponible próximamente. Mientras tanto, podés preparar tu
                carrito.
              </p>
              <Link
                href="/productos"
                className="mt-5 flex justify-center rounded-full bg-brand-600 px-5 py-3 text-sm font-semibold text-white hover:bg-brand-700"
              >
                Seguir viendo productos
              </Link>
              <p className="mt-4 text-xs leading-relaxed text-neutral-500 dark:text-neutral-400">
                Guardar productos en el carrito no reserva el stock. Los precios y la disponibilidad
                pueden cambiar.
              </p>
            </aside>
          </div>
        </>
      )}
    </div>
  )
}
