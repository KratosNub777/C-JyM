import { auth } from './auth'

export function getCustomerSession(headers: Headers) {
  return auth.api.getSession({ headers })
}
