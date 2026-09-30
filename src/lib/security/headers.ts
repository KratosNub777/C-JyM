type Env = Record<string, string | undefined>

// Un año sin `includeSubDomains` ni `preload`: pide al navegador no volver a usar HTTP en este
// dominio, sin arrastrar subdominios que puedan no tener HTTPS (ni una lista de la que es difícil
// salir). Se puede ampliar cuando se confirme que todo el dominio .com.py está en HTTPS.
export const HSTS_VALUE = 'max-age=31536000'

// Vercel ya redirige HTTP a HTTPS; HSTS evita además que el navegador vuelva a intentar por HTTP.
// Solo en producción: el navegador ignora HSTS por HTTP, pero en desarrollo no aporta nada.
export function securityHeaders(env: Env = process.env) {
  if (env.NODE_ENV !== 'production') return []
  return [{ key: 'Strict-Transport-Security', value: HSTS_VALUE }]
}

// Reglas listas para `headers()` de next.config. Next rechaza una regla con la lista de cabeceras
// vacía ("Invalid header found"), así que fuera de producción no se devuelve ninguna regla.
export function securityHeaderRules(env: Env = process.env) {
  const headers = securityHeaders(env)
  return headers.length ? [{ source: '/:path*', headers }] : []
}
