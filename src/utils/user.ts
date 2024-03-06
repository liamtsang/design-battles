import { Context } from 'hono'
import { getCookie } from 'hono/cookie'
import { HTTPException } from 'hono/http-exception'
import { User, UserProfile, UserRank, FigmaUser } from './types'

export async function getUser(
  c: Context
): Promise<{ id: string; object: unknown }> {
  const id = getCookie(c, 'id') as string
  const user = await c.env.USER_KV.get(id)
  if (user === null) {
    throw new HTTPException(401, {
      message: 'User does not exist or you are not logged in.'
    })
  }
  return { id: id, object: JSON.parse(user) }
}

export async function createUser(c: Context, data: FigmaUser) {
  console.log('Createuser called')
  const user_id = data.id
  const user_email = data.email
  const user_handle = data.handle
  const img_url = data.img_url

  const UserProfile: UserProfile = {
    handle: user_handle,
    avatarUrl: img_url,
    biography: '',
    country: ''
  }

  const UserRank: UserRank = {
    elo: 1000,
    rankTitle: 'Unranked',
    rankLevel: 0,
    league: ''
  }

  const User: User = {
    handle: user_handle,
    email: user_email,
    profile: UserProfile,
    rank: UserRank,
    matchesPlayed: [],
    registrationDate: new Date(Date.now())
  }

  const userjson = JSON.stringify(User)
  try {
    await c.env.USER_KV.put(user_id as string, userjson)
  } catch (e) {
    console.error(e)
  }
  console.log('User Created: ' + User)
}
