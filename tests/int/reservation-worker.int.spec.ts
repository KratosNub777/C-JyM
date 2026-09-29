// @vitest-environment node
import { spawn } from 'node:child_process'
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http'
import { describe, expect, it } from 'vitest'

const secret = 'worker-fixture-secret-at-least-32-characters'
async function runOnce(handler: (request: IncomingMessage, response: ServerResponse) => void) {
  const server = createServer(handler)
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  const address = server.address()
  if (!address || typeof address === 'string') throw new Error('Test server did not start')
  try {
    return await new Promise<{ code: number | null; stdout: string; stderr: string }>(
      (resolve, reject) => {
        const child = spawn(process.execPath, ['scripts/reservation-worker.mjs', '--once'], {
          env: {
            ...process.env,
            SITE_URL: `http://127.0.0.1:${address.port}`,
            CRON_SECRET: secret,
          },
        })
        let stdout = ''
        let stderr = ''
        const timeout = setTimeout(() => {
          child.kill()
          reject(new Error('Worker did not finish'))
        }, 10000)
        child.stdout.on('data', (data) => {
          stdout += String(data)
        })
        child.stderr.on('data', (data) => {
          stderr += String(data)
        })
        child.on('error', (error) => {
          clearTimeout(timeout)
          reject(error)
        })
        child.on('close', (code) => {
          clearTimeout(timeout)
          resolve({ code, stdout, stderr })
        })
      },
    )
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()))
  }
}

describe('Reservation worker executable', () => {
  it('authenticates a real HTTP request and reports successful expiration', async () => {
    let authorization: string | undefined
    let path: string | undefined
    const result = await runOnce((request, response) => {
      authorization = request.headers.authorization
      path = request.url
      response.setHeader('content-type', 'application/json')
      response.end(
        JSON.stringify({ expired: 2, failed: 0, skipped: 0, backfilled: 0, hasMore: false }),
      )
    })
    expect(authorization).toBe(`Bearer ${secret}`)
    expect(path).toBe('/api/cron/expire-orders')
    expect(result.code).toBe(0)
    expect(JSON.parse(result.stdout).expired).toBe(2)
    expect(result.stdout + result.stderr).not.toContain(secret)
  })
  it('exits with failure on an unauthorized scheduler response', async () => {
    const result = await runOnce((_request, response) => {
      response.statusCode = 401
      response.end('No autorizado')
    })
    expect(result.code).toBe(1)
    expect(result.stderr).toContain('HTTP 401')
    expect(result.stderr).not.toContain(secret)
  })
})
