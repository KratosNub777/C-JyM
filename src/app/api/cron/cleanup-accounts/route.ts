import { customerAuthPool } from '@/lib/customerAuth/auth'
import { deleteStaleUnverifiedAccounts } from '@/lib/customerAuth/cleanup'
import { authorizedExpirationJob } from '@/lib/checkout/cronAuthorization'

export const runtime = 'nodejs'
export const maxDuration = 60
const responseHeaders = { 'Cache-Control': 'no-store' }

// Misma protección que el vencimiento de reservas: Vercel Cron manda `Bearer CRON_SECRET`.
export async function POST(request: Request) {
  if (!authorizedExpirationJob(request.headers.get('authorization'), process.env.CRON_SECRET)) {
    return Response.json({ error: 'No autorizado.' }, { status: 401, headers: responseHeaders })
  }
  try {
    const report = await deleteStaleUnverifiedAccounts(customerAuthPool)
    return Response.json(report, { headers: responseHeaders })
  } catch (error) {
    console.error('No se pudieron borrar las cuentas sin verificar:', error)
    return Response.json(
      { error: 'No se pudo limpiar las cuentas sin verificar.' },
      { status: 503, headers: responseHeaders },
    )
  }
}

// Vercel Cron invoca con GET.
export const GET = POST
