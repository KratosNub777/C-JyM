import { afterEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({ sendMail: vi.fn(), createTransport: vi.fn() }))
vi.mock('nodemailer', () => ({ default: { createTransport: mocks.createTransport } }))

import { sendEmail, smtpConfigFromEnv } from '@/lib/email/mailer'

const email = {
  to: 'cliente@example.com',
  subject: 'Asunto',
  text: 'Texto 123456',
  html: '<p>Hola</p>',
}

afterEach(() => {
  vi.clearAllMocks()
  delete (globalThis as { smtpTransport?: unknown }).smtpTransport
})

describe('smtpConfigFromEnv', () => {
  it('is disabled without a host', () => {
    expect(smtpConfigFromEnv({})).toBeNull()
    expect(smtpConfigFromEnv({ SMTP_HOST: '  ' })).toBeNull()
  })

  it('reads the configuration and defaults to the STARTTLS port', () => {
    expect(
      smtpConfigFromEnv({
        SMTP_HOST: 'smtp.example.com',
        SMTP_USER: 'usuario',
        SMTP_PASSWORD: 'clave',
        SMTP_FROM: 'Tienda <no-responder@example.com>',
      }),
    ).toEqual({
      host: 'smtp.example.com',
      port: 587,
      user: 'usuario',
      password: 'clave',
      from: 'Tienda <no-responder@example.com>',
    })
  })

  it('rejects incomplete or invalid settings instead of half sending', () => {
    const base = { SMTP_HOST: 'smtp.example.com', SMTP_FROM: 'a@example.com' }
    expect(() => smtpConfigFromEnv({ SMTP_HOST: 'smtp.example.com' })).toThrow(/SMTP_FROM/)
    expect(() => smtpConfigFromEnv({ ...base, SMTP_PORT: 'abc' })).toThrow(/SMTP_PORT/)
    expect(() => smtpConfigFromEnv({ ...base, SMTP_PORT: '70000' })).toThrow(/SMTP_PORT/)
    expect(() => smtpConfigFromEnv({ ...base, SMTP_USER: 'solo-usuario' })).toThrow(/SMTP_PASSWORD/)
  })
})

describe('sendEmail', () => {
  it('prints the email in development when SMTP is not configured', async () => {
    const info = vi.spyOn(console, 'info').mockImplementation(() => {})
    await sendEmail(email, { NODE_ENV: 'development' })
    expect(info).toHaveBeenCalledWith(expect.stringContaining('Texto 123456'))
    expect(mocks.createTransport).not.toHaveBeenCalled()
    info.mockRestore()
  })

  it('fails in production when SMTP is not configured', async () => {
    await expect(sendEmail(email, { NODE_ENV: 'production' })).rejects.toThrow(/SMTP/)
  })

  it('sends through SMTP with STARTTLS required on port 587', async () => {
    mocks.createTransport.mockReturnValue({ sendMail: mocks.sendMail })
    await sendEmail(email, {
      SMTP_HOST: 'smtp.example.com',
      SMTP_USER: 'usuario',
      SMTP_PASSWORD: 'clave',
      SMTP_FROM: 'Tienda <no-responder@example.com>',
    })
    expect(mocks.createTransport).toHaveBeenCalledWith(
      expect.objectContaining({
        host: 'smtp.example.com',
        port: 587,
        secure: false,
        requireTLS: true,
        auth: { user: 'usuario', pass: 'clave' },
      }),
    )
    expect(mocks.sendMail).toHaveBeenCalledWith({
      from: 'Tienda <no-responder@example.com>',
      to: 'cliente@example.com',
      subject: 'Asunto',
      text: 'Texto 123456',
      html: '<p>Hola</p>',
    })
  })

  it('uses implicit TLS on port 465 and reuses the transport', async () => {
    mocks.createTransport.mockReturnValue({ sendMail: mocks.sendMail })
    const env = { SMTP_HOST: 'smtp.example.com', SMTP_PORT: '465', SMTP_FROM: 'a@example.com' }
    await sendEmail(email, env)
    await sendEmail(email, env)
    expect(mocks.createTransport).toHaveBeenCalledTimes(1)
    expect(mocks.createTransport).toHaveBeenCalledWith(
      expect.objectContaining({ secure: true, requireTLS: false, auth: undefined }),
    )
    expect(mocks.sendMail).toHaveBeenCalledTimes(2)
  })
})
