import { isSecureUrl } from '@/lib/security/https'

const DEFAULT_SITE_URL = 'http://localhost:3000'

export function getSiteUrl() {
  const siteUrl = process.env.SITE_URL

  if (!siteUrl && process.env.NODE_ENV === 'production') {
    console.warn(
      'SITE_URL no está configurada en producción: metadata, sitemap.xml y robots.txt van a apuntar a localhost.',
    )
  }

  if (siteUrl && process.env.NODE_ENV === 'production' && !isSecureUrl(siteUrl)) {
    console.warn(
      `SITE_URL debe usar https:// en producción (valor actual: ${siteUrl}): metadata, sitemap.xml y robots.txt van a publicar enlaces inseguros.`,
    )
  }

  return siteUrl || DEFAULT_SITE_URL
}
