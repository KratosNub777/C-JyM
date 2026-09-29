import 'dotenv/config'
import { setTimeout as delay } from 'node:timers/promises'

const site = new URL(process.env.SITE_URL || 'http://localhost:3000')
const secret = process.env.CRON_SECRET
const interval = Number(process.env.RESERVATION_POLL_SECONDS || 60)
if (!['http:', 'https:'].includes(site.protocol) || site.username || site.password)
  throw new Error('SITE_URL no es válida.')
if (site.protocol !== 'https:' && !['localhost', '127.0.0.1', '[::1]'].includes(site.hostname))
  throw new Error('El worker requiere HTTPS fuera de localhost.')
if (!secret || secret.length < 32 || secret.length > 256)
  throw new Error('Configurá CRON_SECRET con entre 32 y 256 caracteres.')
if (!Number.isInteger(interval) || interval < 1 || interval > 3600)
  throw new Error('RESERVATION_POLL_SECONDS debe estar entre 1 y 3600.')
const endpoint = new URL('/api/cron/expire-orders', site)
const once = process.argv.includes('--once')
if (!once) console.log(`Worker de reservas activo: revisión cada ${interval} segundos.`)
const shutdown = new AbortController()
for (const signal of ['SIGINT', 'SIGTERM']) process.once(signal, () => shutdown.abort())

while (!shutdown.signal.aborted) {
  let backlog = false
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { authorization: `Bearer ${secret}` },
      signal: AbortSignal.any([shutdown.signal, AbortSignal.timeout(55000)]),
      redirect: 'error',
    })
    if (!response.ok)
      throw new Error(`El proceso de vencimiento respondió HTTP ${response.status}.`)
    const report = await response.json()
    backlog = report.hasMore === true && report.failed === 0
    if (once || report.expired || report.backfilled)
      console.log(JSON.stringify({ time: new Date().toISOString(), ...report }))
  } catch (error) {
    if (shutdown.signal.aborted) break
    console.error(error instanceof Error ? error.message : 'Falló el proceso de vencimiento.')
    if (once) process.exitCode = 1
  }
  if (once) break
  try {
    await delay(backlog ? 1000 : interval * 1000, undefined, { signal: shutdown.signal })
  } catch {
    break
  }
}
