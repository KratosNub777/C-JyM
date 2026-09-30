type Env = Record<string, string | undefined>

// Orígenes extra desde los que se acepta iniciar sesión, además de BETTER_AUTH_URL (que Better Auth
// ya confía): otros dominios de producción (p. ej. con y sin `www`) en BETTER_AUTH_TRUSTED_ORIGINS,
// separados por coma y con la URL exacta (sin comodines), y las URLs de deploy y de rama que
// Vercel expone en cada preview. Las entradas inválidas o que no son http(s) se ignoran.
export function trustedAuthOrigins(env: Env = process.env): string[] {
  const origins = new Set<string>()
  const add = (value: string | undefined) => {
    if (!value?.trim()) return
    try {
      const url = new URL(value.trim())
      // Better Auth interpreta `*` como comodín y `new URL` lo acepta en el host: rechazarlo acá
      // evita confiar por accidente en, por ejemplo, todo *.vercel.app.
      if ((url.protocol === 'https:' || url.protocol === 'http:') && !url.host.includes('*'))
        origins.add(url.origin)
    } catch {
      // Se ignora: una entrada mal escrita no debe romper el arranque de la app.
    }
  }

  for (const value of (env.BETTER_AUTH_TRUSTED_ORIGINS ?? '').split(',')) add(value)
  for (const host of [env.VERCEL_URL, env.VERCEL_BRANCH_URL, env.VERCEL_PROJECT_PRODUCTION_URL])
    if (host?.trim()) add(`https://${host.trim()}`)
  return [...origins]
}
