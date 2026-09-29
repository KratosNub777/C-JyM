import { timingSafeEqual } from 'node:crypto'

export function authorizedExpirationJob(authorization: string | null, secret: string | undefined) {
  if (!secret || secret.length < 32 || !authorization || authorization.length > 512) return false
  const expected = Buffer.from(`Bearer ${secret}`)
  const received = Buffer.from(authorization)
  return expected.length === received.length && timingSafeEqual(expected, received)
}
