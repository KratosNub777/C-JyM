import { headers } from 'next/headers'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getCustomerSession } from '@/lib/customerAuth/session'
import { getPayloadClient } from '@/lib/payload'
import { orderReference } from '@/lib/checkout/model'
import { formatGs } from '@/lib/format'

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ pagina?: string }>
}) {
  const session = await getCustomerSession(await headers())
  if (!session) redirect('/ingresar')
  const { pagina } = await searchParams
  const page =
    pagina && /^\d+$/.test(pagina) && Number.isSafeInteger(Number(pagina))
      ? Math.max(1, Number(pagina))
      : 1
  const payload = await getPayloadClient()
  const orders = await payload.find({
    collection: 'orders',
    where: { customerId: { equals: session.user.id } },
    sort: '-createdAt',
    page,
    limit: 20,
    depth: 0,
    overrideAccess: true,
  })
  return (
    <section>
      <h1 className="text-3xl font-semibold">Mis pedidos</h1>
      {!orders.docs.length ? (
        <p className="mt-6 text-neutral-500">
          Todavía no tenés pedidos.{' '}
          <Link href="/productos" className="font-semibold text-brand-600">
            Ver productos
          </Link>
        </p>
      ) : (
        <ul className="mt-6 space-y-4">
          {orders.docs.map((order) => (
            <li key={order.id}>
              <Link
                href={`/cuenta/pedidos/${order.id}`}
                className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-neutral-200 bg-white p-5 hover:border-brand-600 dark:border-neutral-800 dark:bg-neutral-900/40"
              >
                <span>
                  <span className="font-semibold">{orderReference(order.id)}</span>
                  <span className="mt-2 block text-sm text-neutral-500">
                    {order.status === 'expired'
                      ? 'Vencido'
                      : order.status === 'cancelled'
                        ? 'Cancelado'
                        : 'Pendiente de pago'}{' '}
                    · Retiro en el local
                  </span>
                </span>
                <span className="font-semibold">{formatGs(order.total)} →</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
      <nav
        aria-label="Páginas de pedidos"
        className="mt-6 flex gap-5 text-sm font-semibold text-brand-600"
      >
        {orders.hasPrevPage && <Link href={`/cuenta/pedidos?pagina=${page - 1}`}>← Anterior</Link>}
        {orders.hasNextPage && <Link href={`/cuenta/pedidos?pagina=${page + 1}`}>Siguiente →</Link>}
      </nav>
    </section>
  )
}
