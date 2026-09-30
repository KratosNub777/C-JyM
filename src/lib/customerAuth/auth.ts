import { betterAuth } from 'better-auth'
import { createAuthMiddleware } from 'better-auth/api'
import { emailOTP } from 'better-auth/plugins'
import { after } from 'next/server'
import { Pool } from 'pg'
import { sendEmail } from '@/lib/email/mailer'
import { codeEmail, isCodeEmailKind } from './emails'
import { trustedAuthOrigins } from './origins'

// Un código de 6 dígitos vale 5 minutos y admite 5 intentos: alcanza para que el cliente lo copie
// del email sin dejar margen para adivinarlo.
const CODE_MINUTES = 5
const CODE_ATTEMPTS = 5

// Los emails salen después de responder para que el tiempo de respuesta no delate si una cuenta
// existe, y en Vercel `after` mantiene viva la función hasta terminar el envío. Fuera de un
// request (scripts, tests) no hay `after`: se deja correr sin esperar.
function sendAfterResponse(task: Promise<unknown>) {
  try {
    after(task)
  } catch {
    void task
  }
}

// Reuse connections during Next.js development reloads.
const globalAuth = globalThis as typeof globalThis & { customerAuthPool?: Pool }
export const customerAuthPool =
  globalAuth.customerAuthPool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
    // Cada instancia serverless abre este pool además del de Payload; con pocas conexiones por
    // instancia se evita agotar el límite de Neon. Usar además el endpoint con pooler de Neon.
    max: process.env.NODE_ENV === 'production' ? 3 : 5,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
  })
if (process.env.NODE_ENV !== 'production') globalAuth.customerAuthPool = customerAuthPool

export const auth = betterAuth({
  appName: 'Comercial José María',
  database: customerAuthPool,
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL,
  // Sin esto solo se acepta el origen exacto de BETTER_AUTH_URL: en www/apex alternativos o en
  // previews de Vercel el login respondería 403 (Invalid origin).
  trustedOrigins: trustedAuthOrigins(),
  emailAndPassword: {
    enabled: true,
    // Sin verificar el email no hay sesión: evita registrar el correo de otra persona y hace que
    // el registro con un email existente responda igual que uno nuevo.
    requireEmailVerification: true,
    minPasswordLength: 8,
    maxPasswordLength: 128,
    // Cambiar la contraseña con el código cierra las sesiones abiertas de la cuenta.
    revokeSessionsOnPasswordReset: true,
  },
  emailVerification: {
    // No se envía desde el registro: Better Auth lo despacha en segundo plano cuando la transacción
    // del alta ya cerró y el envío falla ("Transaction is already committed"). El formulario pide
    // el código con una llamada aparte apenas termina el registro (ver CustomerAuthForm).
    sendOnSignUp: false,
    // Un cliente con la contraseña correcta pero sin verificar recibe un código nuevo al ingresar.
    sendOnSignIn: true,
    autoSignInAfterVerification: true,
  },
  advanced: { backgroundTasks: { handler: sendAfterResponse } },
  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      if (ctx.path !== '/sign-up/email') return
      const email = typeof ctx.body?.email === 'string' ? ctx.body.email.toLowerCase() : ''
      if (!email) return
      // Una cuenta sin verificar no demostró ser dueña del email. Si quedara en pie, quien la creó
      // primero conservaría su contraseña y podría entrar cuando el verdadero dueño se registre y
      // verifique el código. El último registro sin verificar reemplaza al anterior; las cuentas
      // verificadas no se tocan (ahí Better Auth responde igual que con un email nuevo).
      const existing = await ctx.context.internalAdapter.findUserByEmail(email)
      if (existing?.user && !existing.user.emailVerified)
        await ctx.context.internalAdapter.deleteUser(existing.user.id)
    }),
  },
  plugins: [
    emailOTP({
      overrideDefaultEmailVerification: true,
      otpLength: 6,
      expiresIn: CODE_MINUTES * 60,
      allowedAttempts: CODE_ATTEMPTS,
      // Cifrado con el secreto: un volcado de la base no expone códigos vigentes y el servidor
      // (por ejemplo los E2E) aún puede leerlos con auth.api.getVerificationOTP.
      storeOTP: 'encrypted',
      async sendVerificationOTP({ email, otp, type }) {
        if (!isCodeEmailKind(type)) return
        await sendEmail(codeEmail(type, email, otp, CODE_MINUTES))
      },
    }),
  ],
  // Persist limits across serverless instances as well as development requests.
  rateLimit: {
    enabled: true,
    storage: 'database',
    modelName: 'rate_limit',
    // El menú del header consulta la sesión en cada página vista. Es de solo lectura y sin cookie
    // responde null sin tocar la base; contarla acá sumaría una escritura en Postgres por visita.
    customRules: {
      '/get-session': false,
      // Los intentos por código ya están limitados; esto frena además el goteo desde una misma IP.
      '/email-otp/verify-email': { window: 60, max: 10 },
      '/email-otp/reset-password': { window: 60, max: 10 },
    },
  },
})
