import { describe, expect, it } from 'vitest'

import {
  authFailureMessage,
  codeFailureMessage,
  isEmailNotVerified,
} from '@/lib/customerAuth/errors'

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

describe('isEmailNotVerified', () => {
  it('only matches the 403 the server sends for a correct password on an unverified account', () => {
    expect(isEmailNotVerified({ status: 403, code: 'EMAIL_NOT_VERIFIED' })).toBe(true)
    expect(isEmailNotVerified({ status: 403, code: 'INVALID_ORIGIN' })).toBe(false)
    expect(isEmailNotVerified({ status: 401, code: 'INVALID_EMAIL_OR_PASSWORD' })).toBe(false)
    expect(isEmailNotVerified(null)).toBe(false)
  })
})

describe('codeFailureMessage', () => {
  it('explains expired codes and exhausted attempts so the customer asks for a new one', () => {
    expect(codeFailureMessage({ status: 400, code: 'OTP_EXPIRED' })).toMatch(/venció/)
    expect(codeFailureMessage({ status: 403, code: 'TOO_MANY_ATTEMPTS' })).toMatch(/intentos/)
  })

  it('does not reveal whether the account exists', () => {
    const invalid = codeFailureMessage({ status: 400, code: 'INVALID_OTP' })
    expect(codeFailureMessage({ status: 400, code: 'USER_NOT_FOUND' })).toBe(invalid)
    expect(invalid).toMatch(/incorrecto/)
  })

  it('separates rate limits, password rules and server failures', () => {
    expect(codeFailureMessage({ status: 429 })).toMatch(/Demasiados intentos/)
    expect(codeFailureMessage({ status: 400, code: 'PASSWORD_TOO_SHORT' })).toMatch(/8 y 128/)
    expect(codeFailureMessage({ status: 403 })).toMatch(/origen/)
    expect(codeFailureMessage({ status: 500 })).toMatch(/de nuestro lado/)
    expect(codeFailureMessage({})).toMatch(/de nuestro lado/)
  })
})
