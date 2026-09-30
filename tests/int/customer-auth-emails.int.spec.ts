import { describe, expect, it } from 'vitest'

import { codeEmail, isCodeEmailKind } from '@/lib/customerAuth/emails'

describe('codeEmail', () => {
  it('builds the verification email with the code, expiry and a safety notice', () => {
    const email = codeEmail('email-verification', 'cliente@example.com', '042917', 5)
    expect(email.to).toBe('cliente@example.com')
    expect(email.subject).toMatch(/verificación/)
    for (const body of [email.text, email.html]) {
      expect(body).toContain('042917')
      expect(body).toContain('5 minutos')
      expect(body).toContain('nunca te lo va a pedir')
    }
  })

  it('builds the password reset email', () => {
    const email = codeEmail('forget-password', 'cliente@example.com', '123456', 5)
    expect(email.subject).toMatch(/restablecer/)
    expect(email.text).toContain('tu contraseña actual sigue funcionando')
  })

  it('refuses codes that are not plain digits', () => {
    expect(() => codeEmail('email-verification', 'a@example.com', '<b>1</b>', 5)).toThrow()
    expect(() => codeEmail('email-verification', 'a@example.com', '12', 5)).toThrow()
  })

  it('only supports the flows the store uses', () => {
    expect(isCodeEmailKind('email-verification')).toBe(true)
    expect(isCodeEmailKind('forget-password')).toBe(true)
    expect(isCodeEmailKind('sign-in')).toBe(false)
  })
})
