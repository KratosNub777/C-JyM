import 'dotenv/config'

import { describeSmtpError, sendEmail, smtpConfigFromEnv, verifySmtp } from '@/lib/email/mailer'

// Prueba el SMTP configurado en .env sin registrar usuarios:
//   npm run email:test -- destino@correo.com
// Sin destino usa SMTP_USER si es un email. Nunca imprime la contraseña.
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

async function main() {
  let config
  try {
    config = smtpConfigFromEnv()
  } catch (error) {
    console.error(`✗ Configuración incompleta: ${(error as Error).message}`)
    process.exit(1)
  }
  if (!config) {
    console.error(
      '✗ SMTP_HOST está vacío. Cargá SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD y SMTP_FROM en .env (ver .env.example) y reiniciá el comando.',
    )
    process.exit(1)
  }

  const to = process.argv[2] ?? (config.user && EMAIL.test(config.user) ? config.user : '')
  if (!EMAIL.test(to)) {
    console.error('✗ Indicá el email de destino: npm run email:test -- destino@correo.com')
    process.exit(1)
  }

  console.log(`Servidor: ${config.host}:${config.port}`)
  console.log(`Usuario:  ${config.user ?? '(sin autenticación)'}`)
  console.log(`Remitente: ${config.from}`)
  console.log(`Destino:   ${to}\n`)

  try {
    await verifySmtp(config)
    console.log('✓ Conexión y credenciales correctas.')
  } catch (error) {
    console.error(`✗ No se pudo conectar o autenticar.\n  ${describeSmtpError(error, config)}`)
    process.exit(1)
  }

  try {
    await sendEmail({
      to,
      subject: 'Prueba de correo - Comercial José María',
      text: 'Si leés esto, el envío de emails de la tienda funciona.\n\nEste mensaje lo generó `npm run email:test`; no hace falta responderlo.',
      html: '<p>Si leés esto, el envío de emails de la tienda funciona.</p><p style="color:#555">Este mensaje lo generó <code>npm run email:test</code>; no hace falta responderlo.</p>',
    })
    console.log(`✓ Correo enviado a ${to}. Revisá la bandeja de entrada y el correo no deseado.`)
  } catch (error) {
    console.error(
      `✗ Las credenciales sirven pero el envío falló.\n  ${describeSmtpError(error, config)}`,
    )
    process.exit(1)
  }
  process.exit(0)
}

main()
