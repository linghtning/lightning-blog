import { z } from 'zod'

const envSchema = z.object({
  NODE_ENV: z.string().default('development'),
  PORT: z.coerce.number().default(10004),
  DATABASE_URL: z.string().optional(),
  PUBLIC_BASE_URL: z.string().default('http://blog.orgcatfun.site'),
  PORTAL_BASE_URL: z.string().default('http://orgcatfun.site'),
  SSO_CALLBACK_URL: z
    .string()
    .default('http://blog.orgcatfun.site/auth/callback'),
  OIDC_CLIENT_ID: z.string().default('blog'),
})

export type BlogEnv = z.infer<typeof envSchema>

export function readEnv(source = process.env): BlogEnv {
  return envSchema.parse(source)
}
