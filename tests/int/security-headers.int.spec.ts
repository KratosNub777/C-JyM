import { describe, expect, it } from 'vitest'

import { HSTS_VALUE, securityHeaderRules, securityHeaders } from '@/lib/security/headers'

describe('securityHeaders', () => {
  it('adds HSTS in production', () => {
    expect(securityHeaders({ NODE_ENV: 'production' })).toEqual([
      { key: 'Strict-Transport-Security', value: HSTS_VALUE },
    ])
  })

  it('adds nothing in development or tests', () => {
    expect(securityHeaders({ NODE_ENV: 'development' })).toEqual([])
    expect(securityHeaders({ NODE_ENV: 'test' })).toEqual([])
    expect(securityHeaders({})).toEqual([])
  })

  it('does not commit every subdomain or the preload list', () => {
    expect(HSTS_VALUE).not.toMatch(/includeSubDomains|preload/i)
    expect(HSTS_VALUE).toMatch(/max-age=\d{7,}/)
  })
})

describe('securityHeaderRules', () => {
  it('returns one rule with headers in production', () => {
    expect(securityHeaderRules({ NODE_ENV: 'production' })).toEqual([
      {
        source: '/:path*',
        headers: [{ key: 'Strict-Transport-Security', value: HSTS_VALUE }],
      },
    ])
  })

  it('returns no rule outside production, because Next rejects a rule without headers', () => {
    expect(securityHeaderRules({ NODE_ENV: 'development' })).toEqual([])
    for (const rule of securityHeaderRules({ NODE_ENV: 'production' }))
      expect(rule.headers.length).toBeGreaterThan(0)
  })
})
