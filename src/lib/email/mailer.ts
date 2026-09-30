import nodemailer, { type Transporter } from 'nodemailer'

export type Email = { to: string; subject: string; text: string; html: string }

type Env = Record<string, string | undefined>
export type SmtpConfig = {
  host: string
  port: number
  user?: string
  password?: string
  from: string
}

// SMTP genérico: sirve con Gmail para probar y con Resend, SendGrid o el correo del dominio en
// producción. Sin SMTP_HOST devuelve null y se usa el modo de desarrollo de `sendEmail`.
export function smtpConfigFromEnv(env: Env = process.env): SmtpConfig | null {
  const host = env.SMTP_HOST?.trim()
  if (!host) return null
  const port = env.SMTP_PORT?.trim() ? Number(env.SMTP_PORT) : 587
  if (!Number.isInteger(port) || port < 1 || port > 65535)
    throw new Error('SMTP_PORT debe ser un puerto válido.')
  const from = env.SMTP_FROM?.trim()
  if (!from) throw new Error('Configurá SMTP_FROM junto con SMTP_HOST.')
  const user = env.SMTP_USER?.trim() || undefined
  const password = env.SMTP_PASSWORD || undefined
  if (Boolean(user) !== Boolean(password))
    throw new Error('SMTP_USER y SMTP_PASSWORD deben configurarse juntos.')
  return { host, port, user, password, from }
}

const globalMailer = globalThis as typeof globalThis & {
  smtpTransport?: { key: string; transport: Transporter }
}

function transportFor(config: SmtpConfig) {
  const key = JSON.stringify(config)
  if (globalMailer.smtpTransport?.key !== key) {
    globalMailer.smtpTransport = {
      key,
      transport: nodemailer.createTransport({
        host: config.host,
        port: config.port,
        // 465 usa TLS directo; el resto (587) exige STARTTLS antes de enviar credenciales.
        secure: config.port === 465,
        requireTLS: config.port !== 465,
        auth: config.user ? { user: config.user, pass: config.password } : undefined,
        connectionTimeout: 10_000,
        greetingTimeout: 10_000,
        socketTimeout: 20_000,
      }),
    }
  }
  return globalMailer.smtpTransport.transport
}

export async function sendEmail(email: Email, env: Env = process.env): Promise<void> {
  const config = smtpConfigFromEnv(env)
  if (!config) {
    // En producción un envío que no sale deja al cliente sin poder verificar su cuenta: falla fuerte.
    if (env.NODE_ENV === 'production') throw new Error('SMTP no está configurado.')
    console.info(`[email de desarrollo] Para: ${email.to}\nAsunto: ${email.subject}\n${email.text}`)
    return
  }
  await transportFor(config).sendMail({
    from: config.from,
    to: email.to,
    subject: email.subject,
    text: email.text,
    html: email.html,
  })
}
