type Env = Record<string, string | undefined>

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]'])

// HTTPS, o HTTP solo hacia la propia máquina (desarrollo y `next start` local).
export function isSecureUrl(value: string): boolean {
  try {
    const url = new URL(value)
    if (url.protocol === 'https:') return true
    return url.protocol === 'http:' && LOCAL_HOSTS.has(url.hostname)
  } catch {
    return false
  }
}

// URLs de producción que deben ser https. `required` marca las que no pueden faltar: sin
// BETTER_AUTH_URL Better Auth deduce el protocolo de cada request y las cookies de sesión pueden
// salir sin `Secure`. SITE_URL solo afecta a metadata y sitemap, así que es una advertencia.
export function httpsConfigProblems(env: Env = process.env) {
  const problems: { name: string; message: string; required: boolean }[] = []
  const check = (name: 'BETTER_AUTH_URL' | 'SITE_URL', required: boolean) => {
    const value = env[name]?.trim()
    if (!value) {
      if (required)
        problems.push({ name, required, message: `${name} no está configurada en producción.` })
      return
    }
    if (!isSecureUrl(value))
      problems.push({
        name,
        required,
        message: `${name} debe usar https:// en producción (valor actual: ${value}).`,
      })
  }
  check('BETTER_AUTH_URL', true)
  check('SITE_URL', false)
  return problems
}

// Se llama al iniciar la autenticación: en producción una URL insegura o ausente detiene el
// arranque con un mensaje claro, en vez de servir un login por HTTP.
export function assertHttpsInProduction(env: Env = process.env) {
  if (env.NODE_ENV !== 'production') return
  const blocking = httpsConfigProblems(env).filter((problem) => problem.required)
  if (blocking.length)
    throw new Error(`Configuración insegura: ${blocking.map((item) => item.message).join(' ')}`)
}
