import { cache } from 'react'
import { auth } from './auth'

// Dentro de un mismo request (layout + página de /cuenta) la sesión se consulta una sola vez.
// `cache` compara los argumentos por identidad y cada `await headers()` puede devolver un objeto
// distinto, así que la clave es la cookie como string, que es lo único que identifica la sesión.
const sessionForCookie = cache((cookie: string) =>
  auth.api.getSession({ headers: new Headers({ cookie }) }),
)

export function getCustomerSession(headers: Headers) {
  return sessionForCookie(headers.get('cookie') ?? '')
}
