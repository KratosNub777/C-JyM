import { describe, expect, it } from 'vitest'

import { assertHttpsInProduction, httpsConfigProblems, isSecureUrl } from '@/lib/security/https'

describe('isSecureUrl', () => {
  it('accepts https and http only towards this machine', () => {
    expect(isSecureUrl('https://tienda.com.py')).toBe(true)
    expect(isSecureUrl('http://localhost:3000')).toBe(true)
    expect(isSecureUrl('http://127.0.0.1:3000')).toBe(true)
  })

  it('rejects plain http on a public host and malformed values', () => {
    expect(isSecureUrl('http://tienda.com.py')).toBe(false)
    expect(isSecureUrl('http://localhost.evil.com')).toBe(false)
    expect(isSecureUrl('tienda.com.py')).toBe(false)
    expect(isSecureUrl('ftp://tienda.com.py')).toBe(false)
    expect(isSecureUrl('')).toBe(false)
  })
})

describe('httpsConfigProblems', () => {
  it('reports nothing for a correct production setup', () => {
    expect(
      httpsConfigProblems({
        BETTER_AUTH_URL: 'https://tienda.com.py',
        SITE_URL: 'https://tienda.com.py',
      }),
    ).toEqual([])
  })

  it('requires BETTER_AUTH_URL but only warns about SITE_URL', () => {
    const problems = httpsConfigProblems({ SITE_URL: 'http://tienda.com.py' })
    expect(problems.find((item) => item.name === 'BETTER_AUTH_URL')).toMatchObject({
      required: true,
      message: expect.stringContaining('no está configurada'),
    })
    expect(problems.find((item) => item.name === 'SITE_URL')).toMatchObject({ required: false })
  })
})

describe('assertHttpsInProduction', () => {
  it('does nothing outside production', () => {
    expect(() => assertHttpsInProduction({ NODE_ENV: 'development' })).not.toThrow()
    expect(() =>
      assertHttpsInProduction({ NODE_ENV: 'test', BETTER_AUTH_URL: 'http://tienda.com.py' }),
    ).not.toThrow()
  })

  it('stops production when the auth URL is missing or insecure', () => {
    expect(() => assertHttpsInProduction({ NODE_ENV: 'production' })).toThrow(/BETTER_AUTH_URL/)
    expect(() =>
      assertHttpsInProduction({ NODE_ENV: 'production', BETTER_AUTH_URL: 'http://tienda.com.py' }),
    ).toThrow(/https/)
  })

  it('allows production with https, and local http for next start', () => {
    expect(() =>
      assertHttpsInProduction({ NODE_ENV: 'production', BETTER_AUTH_URL: 'https://tienda.com.py' }),
    ).not.toThrow()
    expect(() =>
      assertHttpsInProduction({ NODE_ENV: 'production', BETTER_AUTH_URL: 'http://localhost:3000' }),
    ).not.toThrow()
  })

  it('does not block production for an insecure SITE_URL alone', () => {
    expect(() =>
      assertHttpsInProduction({
        NODE_ENV: 'production',
        BETTER_AUTH_URL: 'https://tienda.com.py',
        SITE_URL: 'http://tienda.com.py',
      }),
    ).not.toThrow()
  })
})
