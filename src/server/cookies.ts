import type { Context } from 'hono'
import { getCookie, setCookie, deleteCookie } from 'hono/cookie'

const SESSION_TOKEN_KEY = 'lightning_blog_session'

export function getSessionToken(context: Context): string | null {
  return getCookie(context, SESSION_TOKEN_KEY) ?? null
}

export function setSessionToken(context: Context, token: string): void {
  setCookie(context, SESSION_TOKEN_KEY, token, {
    httpOnly: true,
    sameSite: 'Lax',
    path: '/',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  })
}

export function clearSessionToken(context: Context): void {
  deleteCookie(context, SESSION_TOKEN_KEY, { path: '/' })
}
