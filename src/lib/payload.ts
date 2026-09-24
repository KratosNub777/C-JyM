import { getPayload } from 'payload'

import config from '@/payload.config'

export async function getPayloadClient() {
  const payloadConfig = await config
  return getPayload({ config: payloadConfig })
}
