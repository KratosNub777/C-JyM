import { describe, expect, it } from 'vitest'

import { authFailureMessage } from '@/lib/customerAuth/errors'

describe('authFailureMessage', () => {
  it('reports wrong credentials only for rejected sign-in data', () => {
    for (const status of [400, 401, 422])
      expect(authFailureMessage('signIn', status)).toMatch(/incorrectos/)
  })

  it('does not blame the password for origin, rate limit or server failures', () => {
    for (const status of [403, 429, 500, 503, 0, undefined])
      expect(authFailureMessage('signIn', status)).not.toMatch(/incorrectos/)
    expect(authFailureMessage('signIn', 429)).toMatch(/Demasiados intentos/)
    expect(authFailureMessage('signIn', 403)).toMatch(/origen/)
    expect(authFailureMessage('signIn', 500)).toMatch(/de nuestro lado/)
  })

  it('keeps the sign-up message for rejected registrations and reports server failures', () => {
    expect(authFailureMessage('signUp', 422)).toMatch(/No pudimos crear la cuenta/)
    expect(authFailureMessage('signUp', 503)).toMatch(/de nuestro lado/)
    expect(authFailureMessage('signUp', 429)).toMatch(/Demasiados intentos/)
  })
})
