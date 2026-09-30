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

export const EMAIL_NOT_VERIFIED_CODE = 'EMAIL_NOT_VERIFIED'

export function isEmailNotVerified(error: { status?: number; code?: string } | null | undefined) {
  return error?.status === 403 && error.code === EMAIL_NOT_VERIFIED_CODE
}

// Mensajes para los formularios de código (verificar email y restablecer contraseña). No se
// distingue si el email existe: un código inválido y una cuenta inexistente se ven igual.
export function codeFailureMessage(error: { status?: number; code?: string }): string {
  if (error.status === 429) return TOO_MANY
  if (error.code === 'OTP_EXPIRED') return 'El código venció. Pedí uno nuevo.'
  if (error.code === 'TOO_MANY_ATTEMPTS')
    return 'Superaste los intentos permitidos para ese código. Pedí uno nuevo.'
  if (error.code === 'PASSWORD_TOO_SHORT' || error.code === 'PASSWORD_TOO_LONG')
    return 'La contraseña debe tener entre 8 y 128 caracteres.'
  if (error.status === 403) return ORIGIN
  if (error.status === 400 || error.status === 422)
    return 'El código es incorrecto o ya no es válido. Revisalo o pedí uno nuevo.'
  return SERVER
}
