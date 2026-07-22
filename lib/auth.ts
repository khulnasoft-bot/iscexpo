import { betterAuth } from 'better-auth'
import { phoneNumber } from 'better-auth/plugins'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { getDb } from './db'
import { validateEnv } from './env'
import * as schema from './db/schema'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _auth: any = null

async function sendSupabaseSMS(phoneNumber: string, code: string) {
  const supabaseUrl = process.env.SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error(
      '[OTP] OTP delivery is not configured (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY). ' +
        'Set these variables or the auth OTP flow will be unavailable.',
    )
    return
  }

  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/send-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${supabaseServiceKey}`,
      },
      body: JSON.stringify({ phoneNumber, code }),
    })

    if (!response.ok) {
      console.error(
        '[OTP] Supabase Edge Function failed:',
        response.status,
        await response.text(),
      )
    }
  } catch (error) {
    console.error('[OTP] Failed to call Supabase Edge Function:', error)
  }
}

function getStaticTrustedOrigins(env: ReturnType<typeof validateEnv>) {
  const configured =
    env.BETTER_AUTH_TRUSTED_ORIGINS?.split(',')
      .map((origin) => origin.trim())
      .filter(Boolean) ?? []

  const defaults = [
    'http://localhost:*',
    'https://localhost:*',
    'http://127.0.0.1:*',
    'https://127.0.0.1:*',
    'http://0.0.0.0:*',
    'https://0.0.0.0:*',
    'http://[::1]:*',
    'https://[::1]:*',
  ]

  const normalized = new Set<string>()

  for (const origin of [
    ...configured,
    ...defaults,
    env.BETTER_AUTH_URL || '',
  ]) {
    const trimmed = origin.trim().replace(/\/$/, '')
    if (trimmed) normalized.add(trimmed)
  }

  return Array.from(normalized)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function createAuth(): any {
  const env = validateEnv()
  const db = getDb()

  return betterAuth({
    baseURL: env.BETTER_AUTH_URL || 'http://localhost:3000',
    secret: env.BETTER_AUTH_SECRET,
    trustedOrigins: async (request: Request) => {
      const origins = getStaticTrustedOrigins(env)
      const origin = request.headers.get('origin')
      if (origin) origins.push(origin)
      return origins
    },
    database: drizzleAdapter(db, {
      provider: 'pg',
      schema,
    }),
    user: {
      additionalFields: {
        role: {
          type: 'string',
          required: false,
          defaultValue: 'student',
          input: false,
        },
        studentId: {
          type: 'string',
          required: false,
          unique: true,
          input: true,
        },
      },
    },
    session: {
      expiresIn: 60 * 60 * 24 * 7, // 7 days
      updateAge: 60 * 60 * 24, // refresh every 24h
      // Limit concurrent sessions per user
      // Better Auth doesn't natively enforce this, but we can
      // use a hook. For now, store the limit as a config value
      // and enforce it in the logout-all endpoint.
      freshAge: 60 * 60, // 1 hour — sessions younger than this are "fresh"
    },
    emailAndPassword: {
      enabled: true,
    },
    plugins: [
      phoneNumber({
        sendOTP: ({ phoneNumber: phone, code }) => {
          sendSupabaseSMS(phone, code)
        },
        otpLength: 6,
        expiresIn: 300,
      }),
    ],
  })
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getAuth(): any {
  if (!_auth) {
    _auth = createAuth()
  }
  return _auth
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const auth: any = new Proxy({} as any, {
  get(_, prop) {
    return (getAuth() as any)[prop]
  },
})
