import 'dotenv/config'
import { expect, type Page } from '@playwright/test'
import { auth, customerAuthPool } from '../../src/lib/customerAuth/auth'

type CodeType = 'email-verification' | 'forget-password'

// Los códigos se guardan cifrados: se leen con la API de servidor de Better Auth, que usa el mismo
// secreto que la app. El envío ocurre en una llamada aparte del navegador, así que se espera.
export async function readEmailCode(email: string, type: CodeType = 'email-verification') {
  for (let attempt = 0; attempt < 40; attempt++) {
    const { otp } = await auth.api.getVerificationOTP({ query: { email, type } })
    if (otp) return otp
    await new Promise((resolve) => setTimeout(resolve, 250))
  }
  throw new Error(`No se generó un código de ${type} para ${email}`)
}

// El pool de Better Auth es global y lo comparten todos los specs de un mismo worker: ningún spec lo
// cierra (se libera solo al terminar el worker), o el siguiente lo encontraría cerrado.
// El límite de Better Auth vive en Postgres y los E2E previos lo agotan (registro: 3 cada 10 s,
// códigos: 3 por minuto). Solo borra contadores efímeros de la base de desarrollo.
export async function resetAuthRateLimits() {
  await customerAuthPool.query('DELETE FROM rate_limit')
}

export async function fillRegistration(
  page: Page,
  { name, email, password }: { name: string; email: string; password: string },
) {
  await page.getByLabel('Nombre completo', { exact: true }).fill(name)
  await page.getByLabel('Email', { exact: true }).fill(email)
  await page.getByLabel('Contraseña', { exact: true }).fill(password)
  await page.getByLabel('Confirmar contraseña', { exact: true }).fill(password)
  await page.getByRole('button', { name: 'Crear cuenta', exact: true }).click()
}

// Desde /verificar-email: escribe el código emitido para `email` y confirma.
export async function submitVerificationCode(page: Page, email: string, code?: string) {
  await expect(page).toHaveURL(/\/verificar-email/)
  await page
    .getByLabel('Código de verificación')
    .fill(code ?? (await readEmailCode(email, 'email-verification')))
  await page.getByRole('button', { name: 'Verificar', exact: true }).click()
}
