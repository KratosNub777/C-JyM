import { headers } from 'next/headers'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { getCustomerSession } from '@/lib/customerAuth/session'
import { getPayloadClient } from '@/lib/payload'
import { orderReference } from '@/lib/checkout/model'
import { formatGs } from '@/lib/format'
import { CancelOrderButton } from '@/components/checkout/CancelOrderButton'
import { reservationDeadline } from '@/lib/checkout/reservationPolicy'

export default async function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getCustomerSession(await headers())
  if (!session) redirect('/ingresar')
  const { id } = await params
  if (!/^\d+$/.test(id) || !Number.isSafeInteger(Number(id))) notFound()
  const payload = await getPayloadClient()
  const found = await payload.find({
    collection: 'orders',
    where: { and: [{ id: { equals: Number(id) } }, { customerId: { equals: session.user.id } }] },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })
  const order = found.docs[0]
  if (!order) notFound()
  return (
    <article>
      <Link
        href="/cuenta/pedidos"
        className="text-sm font-semibold text-brand-600 dark:text-brand-400"
      >
        ← Mis pedidos
      </Link>
      <h1 className="mt-5 text-3xl font-semibold">Pedido {orderReference(order.id)}</h1>
      <p
        role="status"
        className={`mt-4 inline-block rounded-full px-4 py-2 text-sm font-medium ${order.status !== 'pending_payment' ? 'bg-neutral-100 dark:bg-neutral-800' : 'bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200'}`}
      >
        {order.status === 'expired'
          ? 'Vencido'
          : order.status === 'cancelled'
            ? 'Cancelado'
            : 'Pendiente de pago'}
      </p>
      <p className="mt-5 text-sm text-neutral-500 dark:text-neutral-400">
        {order.status === 'expired'
          ? 'El plazo para pagar terminó. Tu pedido venció y el stock reservado se liberó. Podés armar un nuevo carrito con los precios y la disponibilidad actuales.'
          : order.status === 'cancelled'
            ? 'Tu pedido fue cancelado y el stock reservado se liberó.'
            : 'Tu pedido está registrado y el stock está reservado. Coordiná el pago y el retiro con el local. No se realizó ningún cobro online.'}
      </p>
      {order.status === 'pending_payment' && (
        <p className="mt-4 rounded-xl bg-amber-50 p-4 text-sm text-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
          Reserva hasta el{' '}
          {new Intl.DateTimeFormat('es-PY', {
            dateStyle: 'medium',
            timeStyle: 'short',
            timeZone: 'America/Asuncion',
          }).format(new Date(reservationDeadline(order)))}{' '}
          (hora de Paraguay). Si el pedido sigue impago, vencerá automáticamente.
        </p>
      )}
      <section className="mt-7 rounded-2xl border border-neutral-200 bg-white p-5 sm:p-7 dark:border-neutral-800 dark:bg-neutral-900/40">
        <h2 className="text-lg font-semibold">Resumen del pedido</h2>
        <ul className="mt-5 divide-y divide-neutral-200 dark:divide-neutral-800">
          {order.items.map((item) => (
            <li key={item.id ?? item.productId} className="flex gap-4 py-4">
              <div className="min-w-0 flex-1">
                <p className="font-medium">{item.name}</p>
                <p className="mt-1 text-sm text-neutral-500">
                  {item.quantity} × {formatGs(item.unitPrice)}
                </p>
              </div>
              <p className="shrink-0 text-sm font-semibold tabular-nums">
                {formatGs(item.lineTotal)}
              </p>
            </li>
          ))}
        </ul>
        <div className="mt-4 flex justify-between border-t border-neutral-200 pt-5 text-lg font-semibold dark:border-neutral-800">
          <span>Total</span>
          <span>{formatGs(order.total)}</span>
        </div>
        <div className="mt-6 space-y-2 break-words text-sm text-neutral-500 dark:text-neutral-400">
          <p>Retiro en el local · Sin costo de entrega</p>
          <p>
            {order.customerName} · {order.phone}
          </p>
          <p>{order.customerEmail}</p>
          {order.notes && <p>Observaciones: {order.notes}</p>}
          <p>
            Creado el{' '}
            {new Intl.DateTimeFormat('es-PY', {
              dateStyle: 'medium',
              timeStyle: 'short',
              timeZone: 'America/Asuncion',
            }).format(new Date(order.createdAt))}
          </p>
        </div>
        {order.status === 'pending_payment' && <CancelOrderButton orderId={order.id} />}
      </section>
    </article>
  )
}
