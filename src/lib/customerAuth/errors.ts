export type AuthMode = 'signIn' | 'signUp'

const TOO_MANY = 'Demasiados intentos. Esperá un minuto y volvé a intentar.'
const ORIGIN = 'No pudimos validar el origen de la solicitud. Recargá la página e intentá de nuevo.'
const SERVER = 'Tuvimos un problema de nuestro lado. Intentá de nuevo en unos minutos.'
const CREDENTIALS = 'Email o contraseña incorrectos. Revisá tus datos.'
const SIGN_UP = 'No pudimos crear la cuenta. Revisá tus datos; si ya tenés una cuenta, ingresá.'

// Solo los rechazos del formulario (400/401/422) se explican como datos incorrectos; un 403 de
// origen, un 5xx o un error de red no deben hacer creer al cliente que se equivocó de contraseña.
export function authFailureMessage(mode: AuthMode, status: number | undefined): string {
  if (status === 429) return TOO_MANY
  if (status === 403) return ORIGIN
  if (status === 400 || status === 401 || status === 422)
    return mode === 'signIn' ? CREDENTIALS : SIGN_UP
  return SERVER
}
