type Env = Record<string, string | undefined>

export type R2Config = {
  bucket: string
  endpoint: string
  accessKeyId: string
  secretAccessKey: string
  // Dirección pública del bucket (dominio propio o r2.dev), sin barra final.
  publicUrl: string
}

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]'])

// https, o http solo hacia la propia máquina (pruebas con un almacenamiento S3 local).
function isHttpsOrLocal(value: string) {
  try {
    const url = new URL(value)
    return url.protocol === 'https:' || (url.protocol === 'http:' && LOCAL_HOSTS.has(url.hostname))
  } catch {
    return false
  }
}

// Sin R2_BUCKET no hay almacenamiento en la nube: las imágenes van al disco local (desarrollo).
// Con R2_BUCKET hace falta todo lo demás; una configuración a medias falla con un mensaje claro en
// vez de subir archivos a ninguna parte.
export function r2ConfigFromEnv(env: Env = process.env): R2Config | null {
  const bucket = env.R2_BUCKET?.trim()
  if (!bucket) return null

  const missing = ['R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY', 'R2_PUBLIC_URL'].filter(
    (name) => !env[name]?.trim(),
  )
  const accountId = env.R2_ACCOUNT_ID?.trim()
  const customEndpoint = env.R2_ENDPOINT?.trim()
  if (!accountId && !customEndpoint) missing.push('R2_ACCOUNT_ID')
  if (missing.length) throw new Error(`R2_BUCKET está definido pero falta: ${missing.join(', ')}.`)

  if (!customEndpoint && !/^[0-9a-f]{32}$/i.test(accountId!))
    throw new Error(
      'R2_ACCOUNT_ID debe tener 32 caracteres hexadecimales (está en el panel de R2).',
    )

  const endpoint = customEndpoint ?? `https://${accountId}.r2.cloudflarestorage.com`
  if (!isHttpsOrLocal(endpoint)) throw new Error('R2_ENDPOINT debe usar https://.')

  const publicUrl = env.R2_PUBLIC_URL!.trim().replace(/\/+$/, '')
  if (!isHttpsOrLocal(publicUrl)) throw new Error('R2_PUBLIC_URL debe usar https://.')

  return {
    bucket,
    endpoint,
    accessKeyId: env.R2_ACCESS_KEY_ID!.trim(),
    secretAccessKey: env.R2_SECRET_ACCESS_KEY!.trim(),
    publicUrl,
  }
}

// URL con la que el navegador pide la imagen directamente al bucket (sin pasar por la app).
export function r2PublicFileUrl(publicUrl: string, filename: string, prefix?: string | null) {
  const path = [prefix, filename]
    .filter((part): part is string => Boolean(part))
    .map((part) => part.split('/').map(encodeURIComponent).join('/'))
    .join('/')
  return `${publicUrl}/${path}`
}

// Patrón para `images.remotePatterns` de next.config: sin esto next/image rechaza las fotos de R2.
export function r2ImagePattern(env: Env = process.env) {
  const publicUrl = env.R2_PUBLIC_URL?.trim()
  if (!publicUrl || !env.R2_BUCKET?.trim()) return null
  try {
    const url = new URL(publicUrl)
    return {
      protocol: url.protocol.replace(':', '') as 'http' | 'https',
      hostname: url.hostname,
      ...(url.port ? { port: url.port } : {}),
    }
  } catch {
    return null
  }
}
