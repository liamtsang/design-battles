import { Context, Hono, Next } from 'hono'
import {
  deleteCookie,
  getCookie,
  getSignedCookie,
  setCookie,
  setSignedCookie
} from 'hono/cookie'
import { HTTPException } from 'hono/http-exception'
import { signOut, verifySession } from '../utils/auth'
import { Token, FigmaUser } from '../utils/types'
import { createUser } from '../utils/user'
import { Bindings } from '../utils/types'

const auth = new Hono<{ Bindings: Bindings }>()

auth.get('/oauth/signin', (c: Context) => {
  console.log(c.env)

  const clientId = c.env.FIGMA_CLIENT_ID
  const redirectUri = 'http://localhost:8787/auth/oauth/callback'
  const scope = 'files:read, file_comments:write, webhooks:write'
  const state = crypto.randomUUID()

  const url = `https://www.figma.com/oauth?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}&state=${state}&response_type=code`
  setCookie(c, 'state', state)
  return c.redirect(url)
})

auth.get('/oauth/signout', async (c: Context) => {
  await signOut(c)
  return c.redirect('/')
})

auth.get('/oauth/callback', async (c: Context) => {
  const clientId = c.env.FIGMA_CLIENT_ID
  const clientSecret = c.env.FIGMA_CLIENT_SECRET
  const redirectUri = 'http://localhost:8787/auth/oauth/callback'
  const code = c.req.query('code')

  const state = c.req.query('state')
  const stateCookie = getCookie(c, 'state')
  if (state !== stateCookie) {
    throw new HTTPException(402, { message: 'State does not match.' })
  }

  const url = `https://www.figma.com/api/oauth/token?client_id=${clientId}&client_secret=${clientSecret}&redirect_uri=${redirectUri}&code=${code}&grant_type=authorization_code`
  const response = await fetch(url, {
    method: 'POST',
    redirect: 'follow'
  })
  const tokens = (await response.json()) as Token

  // KV for accessing tokens
  // Have to change to a new NAMESPACE !!!
  const sessionKey = crypto.randomUUID() as string

  try {
    await c.env.OAUTH_KV.put(sessionKey, tokens.access_token as string)
  } catch (e) {
    console.error('Oauth catch: ' + e)
  }

  const r = await fetch('https://api.figma.com/v1/me', {
    method: 'GET',
    headers: { Authorization: `Bearer ${tokens.access_token}` }
  })

  const user = (await r.json()) as FigmaUser

  setCookie(c, 'id', user.id, {
    expires: new Date(2030, 12)
  })
  setCookie(c, 'handle', user.handle, {
    expires: new Date(2030, 12)
  })
  setCookie(c, 'oauth_session', sessionKey, {
    expires: new Date(2024, 4)
  })
  deleteCookie(c, 'state')

  // Build user KV

  let userkv
  userkv = await c.env.USER_KV.get(user.id)
  if (userkv === null) {
    createUser(c, user)
  }

  return c.html(`${user.id} ${user.handle} ${user.img_url}`)
})

auth.get('/test/protected-route', async (c: Context) => {
  const verified = await verifySession(c)
  if (verified === true) {
    return c.text('Protected route')
  } else {
    throw new HTTPException(401, { message: 'Access denied' })
  }
})

export default auth
