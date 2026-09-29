import { getPayloadClient } from '@/lib/payload'
import { authorizedExpirationJob } from '@/lib/checkout/cronAuthorization'
import { expirePendingOrders } from '@/lib/checkout/expireOrders'
import { refreshOrderCache } from '@/lib/checkout/refreshOrderCache'

export const runtime = 'nodejs'
export const maxDuration = 60
const responseHeaders = { 'Cache-Control': 'no-store' }

export async function POST(request: Request) {
  if (!authorizedExpirationJob(request.headers.get('authorization'), process.env.CRON_SECRET)) {
    return Response.json({ error: 'No autorizado.' }, { status: 401, headers: responseHeaders })
  }
  try {
    const report = await expirePendingOrders(await getPayloadClient())
    if (report.expired || report.failed) refreshOrderCache()
    return Response.json(report, { status: report.failed ? 503 : 200, headers: responseHeaders })
  } catch (error) {
    console.error('No se pudo ejecutar el vencimiento de reservas:', error)
    return Response.json(
      { error: 'No se pudo procesar el vencimiento de reservas.' },
      { status: 503, headers: responseHeaders },
    )
  }
}

// Supports schedulers that invoke a GET, such as Vercel Cron.
export const GET = POST
