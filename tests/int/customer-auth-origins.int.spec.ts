import { describe, expect, it } from 'vitest'

import { trustedAuthOrigins } from '@/lib/customerAuth/origins'

describe('trustedAuthOrigins', () => {
  it('trusts nothing extra by default', () => {
    expect(trustedAuthOrigins({})).toEqual([])
  })

  it('accepts the configured production origins, normalized and deduplicated', () => {
    expect(
      trustedAuthOrigins({
        BETTER_AUTH_TRUSTED_ORIGINS:
          'https://www.tienda.com.py/, https://tienda.com.py , https://www.tienda.com.py/otra',
      }),
    ).toEqual(['https://www.tienda.com.py', 'https://tienda.com.py'])
  })

  it('ignores wildcards, malformed entries and non-http schemes', () => {
    expect(
      trustedAuthOrigins({
        BETTER_AUTH_TRUSTED_ORIGINS:
          'https://*.vercel.app,tienda.com.py,javascript:alert(1),ftp://tienda.com.py,,   ',
      }),
    ).toEqual([])
  })

  it('keeps http only for localhost and drops it for public hosts', () => {
    expect(
      trustedAuthOrigins({
        BETTER_AUTH_TRUSTED_ORIGINS:
          'http://tienda.com.py,http://localhost:3000,http://127.0.0.1:3000,https://www.tienda.com.py',
      }),
    ).toEqual(['http://localhost:3000', 'http://127.0.0.1:3000', 'https://www.tienda.com.py'])
  })

  it('adds the Vercel deployment, branch and production hosts over https', () => {
    expect(
      trustedAuthOrigins({
        VERCEL_URL: 'c-jym-abc123.vercel.app',
        VERCEL_BRANCH_URL: 'c-jym-git-feature-team.vercel.app',
        VERCEL_PROJECT_PRODUCTION_URL: 'tienda.com.py',
      }),
    ).toEqual([
      'https://c-jym-abc123.vercel.app',
      'https://c-jym-git-feature-team.vercel.app',
      'https://tienda.com.py',
    ])
  })
})
