import { useSyncExternalStore } from 'react'

// El email que está verificando o recuperando el cliente viaja en sessionStorage y no en la URL:
// así no queda en el historial, en los logs del servidor ni en el Referer. Solo se lee en el
// navegador; si el almacenamiento está bloqueado, las pantallas piden el email a mano.
const KEY = 'c-jym.auth.pending-email'

export function savePendingEmail(email: string) {
  try {
    sessionStorage.setItem(KEY, email.trim().toLowerCase())
  } catch {
    // Sin almacenamiento: el cliente escribe el email en la pantalla siguiente.
  }
}

export function readPendingEmail(): string {
  try {
    return sessionStorage.getItem(KEY) ?? ''
  } catch {
    return ''
  }
}

export function clearPendingEmail() {
  try {
    sessionStorage.removeItem(KEY)
  } catch {
    // Nada que limpiar.
  }
}

const noSubscription = () => () => {}

// En el servidor devuelve '' y en el navegador el valor guardado, sin desajuste de hidratación.
export function usePendingEmail(): string {
  return useSyncExternalStore(noSubscription, readPendingEmail, () => '')
}
