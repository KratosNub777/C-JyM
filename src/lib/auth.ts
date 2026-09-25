import { getPayloadClient } from '@/lib/payload'

export async function getAuthenticatedUser(headers: Headers) {
  const payload = await getPayloadClient()
  const { user } = await payload.auth({ headers })
  return user
}
