import { describe, expect, it } from 'vitest'

import { r2ConfigFromEnv, r2ImagePattern, r2PublicFileUrl } from '@/lib/storage/r2'

const base = {
  R2_BUCKET: 'cjym-media-staging',
  R2_ACCOUNT_ID: '8eec0539fa6d8c54454b44f7dc7216c5',
  R2_ACCESS_KEY_ID: 'clave-de-prueba',
  R2_SECRET_ACCESS_KEY: 'secreto-de-prueba',
  R2_PUBLIC_URL: 'https://pub-8efd880a2684425a83a434897505c0fd.r2.dev/',
}

describe('r2ConfigFromEnv', () => {
  it('is disabled without a bucket, so development keeps using the local disk', () => {
    expect(r2ConfigFromEnv({})).toBeNull()
    expect(r2ConfigFromEnv({ R2_BUCKET: '  ' })).toBeNull()
  })

  it('builds the endpoint from the account id and trims the public url', () => {
    expect(r2ConfigFromEnv(base)).toEqual({
      bucket: 'cjym-media-staging',
      endpoint: 'https://8eec0539fa6d8c54454b44f7dc7216c5.r2.cloudflarestorage.com',
      accessKeyId: 'clave-de-prueba',
      secretAccessKey: 'secreto-de-prueba',
      publicUrl: 'https://pub-8efd880a2684425a83a434897505c0fd.r2.dev',
    })
  })

  it('accepts a custom endpoint instead of the account id', () => {
    const { R2_ACCOUNT_ID: _omit, ...rest } = base
    void _omit
    expect(
      r2ConfigFromEnv({ ...rest, R2_ENDPOINT: 'https://x.eu.r2.cloudflarestorage.com' })?.endpoint,
    ).toBe('https://x.eu.r2.cloudflarestorage.com')
  })

  it('names every missing setting instead of half configuring', () => {
    expect(() => r2ConfigFromEnv({ R2_BUCKET: 'b' })).toThrow(
      /R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_PUBLIC_URL, R2_ACCOUNT_ID/,
    )
    expect(() => r2ConfigFromEnv({ ...base, R2_SECRET_ACCESS_KEY: '' })).toThrow(
      /R2_SECRET_ACCESS_KEY/,
    )
  })

  it('rejects an invalid account id and insecure urls', () => {
    expect(() => r2ConfigFromEnv({ ...base, R2_ACCOUNT_ID: 'abc' })).toThrow(/R2_ACCOUNT_ID/)
    expect(() => r2ConfigFromEnv({ ...base, R2_PUBLIC_URL: 'http://pub.r2.dev' })).toThrow(
      /R2_PUBLIC_URL/,
    )
    expect(() => r2ConfigFromEnv({ ...base, R2_ENDPOINT: 'http://evil.example.com' })).toThrow(
      /R2_ENDPOINT/,
    )
  })

  it('allows plain http only towards localhost, for tests against a local S3', () => {
    expect(
      r2ConfigFromEnv({
        ...base,
        R2_ENDPOINT: 'http://localhost:9000',
        R2_PUBLIC_URL: 'http://localhost:9000/b',
      })?.endpoint,
    ).toBe('http://localhost:9000')
  })
})

describe('r2PublicFileUrl', () => {
  it('encodes spaces and keeps the prefix', () => {
    expect(r2PublicFileUrl('https://pub.r2.dev', 'iphone duo.png')).toBe(
      'https://pub.r2.dev/iphone%20duo.png',
    )
    expect(r2PublicFileUrl('https://pub.r2.dev', 'a.png', 'productos/2026')).toBe(
      'https://pub.r2.dev/productos/2026/a.png',
    )
  })
})

describe('r2ImagePattern', () => {
  it('lets next/image load photos from the public bucket host', () => {
    expect(r2ImagePattern(base)).toEqual({
      protocol: 'https',
      hostname: 'pub-8efd880a2684425a83a434897505c0fd.r2.dev',
    })
  })

  it('adds nothing when R2 is not configured', () => {
    expect(r2ImagePattern({})).toBeNull()
    expect(r2ImagePattern({ R2_PUBLIC_URL: 'https://pub.r2.dev' })).toBeNull()
  })
})
