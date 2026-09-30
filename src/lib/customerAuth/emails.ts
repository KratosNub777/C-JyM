import type { Email } from '@/lib/email/mailer'

const STORE = 'Comercial José María'

export type CodeEmailKind = 'email-verification' | 'forget-password'

const COPY: Record<CodeEmailKind, { subject: string; intro: string; ignore: string }> = {
  'email-verification': {
    subject: `Tu código de verificación - ${STORE}`,
    intro: 'Usá este código para verificar tu email y activar tu cuenta:',
    ignore: 'Si no creaste una cuenta, podés ignorar este correo.',
  },
  'forget-password': {
    subject: `Código para restablecer tu contraseña - ${STORE}`,
    intro: 'Recibimos una solicitud para restablecer tu contraseña. Tu código es:',
    ignore: 'Si no la pediste, ignorá este correo: tu contraseña actual sigue funcionando.',
  },
}

export function isCodeEmailKind(value: string): value is CodeEmailKind {
  return value in COPY
}

// El código llega solo con dígitos; se valida para no interpolar nada inesperado en el HTML.
export function codeEmail(kind: CodeEmailKind, to: string, otp: string, minutes: number): Email {
  if (!/^\d{4,10}$/.test(otp)) throw new Error('El código de verificación no es válido.')
  const { subject, intro, ignore } = COPY[kind]
  const expiry = `El código vence en ${minutes} minutos y solo se puede usar una vez.`
  const text = [
    '¡Hola!',
    '',
    intro,
    '',
    otp,
    '',
    expiry,
    'No compartas este código con nadie: nuestro equipo nunca te lo va a pedir.',
    '',
    ignore,
    '',
    STORE,
  ].join('\n')
  const html = `<div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;color:#111">
<p>¡Hola!</p>
<p>${intro}</p>
<p style="font-size:32px;font-weight:bold;letter-spacing:8px;margin:24px 0">${otp}</p>
<p>${expiry}</p>
<p style="color:#555">No compartas este código con nadie: nuestro equipo nunca te lo va a pedir.</p>
<p style="color:#555">${ignore}</p>
<p style="color:#555">${STORE}</p>
</div>`
  return { to, subject, text, html }
}
