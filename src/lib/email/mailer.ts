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

// Comprueba la conexión y las credenciales sin enviar nada. Lanza el error de nodemailer.
export async function verifySmtp(config: SmtpConfig): Promise<void> {
  await transportFor(config).verify()
}

type SmtpError = { code?: string; responseCode?: number; message?: string }

// Traduce los fallos típicos de SMTP a una causa y una acción concretas.
export function describeSmtpError(error: unknown, config?: Pick<SmtpConfig, 'host' | 'port'>) {
  const { code, responseCode, message } = (error ?? {}) as SmtpError
  const where = config ? `${config.host}:${config.port}` : 'el servidor SMTP'
  if (code === 'EAUTH' || responseCode === 535)
    return 'El servidor rechazó el usuario o la contraseña (SMTP_USER / SMTP_PASSWORD). En Gmail hay que usar una contraseña de aplicación, no la contraseña de la cuenta, y tener activada la verificación en dos pasos.'
  if (code === 'ENOTFOUND' || code === 'EDNS')
    return `No se encontró el servidor ${where}. Revisá SMTP_HOST.`
  // nodemailer suele envolver el rechazo como ESOCKET/ECONNECTION y dejar ECONNREFUSED en el texto.
  if (code === 'ECONNREFUSED' || /ECONNREFUSED/.test(message ?? ''))
    return `${where} rechazó la conexión. Revisá SMTP_HOST y SMTP_PORT (587 con STARTTLS o 465 con TLS directo).`
  if (code === 'ETIMEDOUT' || code === 'ECONNECTION' || code === 'ESOCKET') {
    if (/wrong version number|ssl|tls/i.test(message ?? ''))
      return `${where} no negoció TLS como se esperaba. Con el puerto 587 se usa STARTTLS; con 465, TLS directo.`
    return `No se pudo comunicar con ${where} (tiempo agotado o conexión cortada). Revisá el puerto y que la red o el firewall permitan SMTP saliente.`
  }
  if (code === 'EENVELOPE' || responseCode === 550 || responseCode === 553)
    return 'El servidor rechazó el remitente o el destinatario. Revisá SMTP_FROM (muchos proveedores exigen un remitente verificado) y el email de destino.'
  return message || 'Error desconocido al usar el servidor SMTP.'
}
