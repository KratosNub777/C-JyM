import { betterAuth } from 'better-auth'
import { Pool } from 'pg'

// Reuse connections during Next.js development reloads.
const globalAuth = globalThis as typeof globalThis & { customerAuthPool?: Pool }
export const customerAuthPool =
  globalAuth.customerAuthPool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 5,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
  })
if (process.env.NODE_ENV !== 'production') globalAuth.customerAuthPool = customerAuthPool

export const auth = betterAuth({
  appName: 'Comercial José María',
  database: customerAuthPool,
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL,
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    minPasswordLength: 8,
    maxPasswordLength: 128,
  },
  // Persist limits across serverless instances as well as development requests.
  rateLimit: { enabled: true, storage: 'database', modelName: 'rate_limit' },
})
