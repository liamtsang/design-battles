import { Context } from 'hono'
import { deleteCookie, getCookie } from 'hono/cookie'
import {
  User,
  UserPreferences,
  UserProfile,
  UserRank,
  FigmaUser
} from './types'

export async function verifySession(c: Context) {
  const sessionCookie = getCookie(c, 'oauth_session') as string
  if (!sessionCookie) {
    return false
  }
  const sessionKv = await c.env.OAUTH_KV.get(sessionCookie)
  console.log(sessionKv)
  if (!sessionKv) {
    return false
  } else if (sessionKv) {
    return true
  }
}

export async function signOut(c: Context) {
  const sessionCookie = getCookie(c, 'oauth_session') as string
  if (sessionCookie) {
    await c.env.OAUTH_KV.delete(sessionCookie)
  }
  deleteCookie(c, 'oauth_session')
  deleteCookie(c, 'id')
  deleteCookie(c, 'handle')
  return null
}
