import { Context, Hono, Next } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { getCookie } from 'hono/cookie'
import { html } from 'hono/html'
import { stream, streamSSE, streamText } from 'hono/streaming'
import { Bindings, Category, Match, Room, User } from '../utils/types'
import { verifySession } from '../utils/auth'
import { getUser } from '../utils/user'
import Layout from '../views/layout'

const app = new Hono<{ Bindings: Bindings }>()

// User ROOMS_KV for room management

// Query params don't work seemingly, and cookies prob not good.
// Best idea is seperate urls for categorys

app.get('/sse/web', async (c: Context) => {
  const searchResponse: string = await searchForRoom(c, 'web' as Category)
  let i = 0
  return streamSSE(c, async (stream: any) => {
    // Return timer while user is in queue and room is 1 person
    // Allow leaving the queue
    // Durable object

    while (true) {
      const room = JSON.parse(await c.env.ROOMS_KV.get(searchResponse)) as Room
      if (room.users.length === 2) {
        console.log('users = 2')
        await stream.writeSSE({
          event: 'ready-up',
          data: 'Ready Up'
        })
      }
      const message = `${new Date().toISOString()}`
      await stream.writeSSE({
        event: 'timeUpdate',
        // data: message,
        data: String(i++)
      })
      await stream.sleep(1000)
    }
  })
})

app.get('/button', (c: Context) => {
  return c.html(html`
    <div hx-ext="sse" sse-connect="/matchmaker/sse/web" sse-swap="timeUpdate">
      placeholder
    </div>
  `)
})

// Extract match making functionality from this and move to a ready up route
async function searchForRoom(c: Context, category: Category) {
  const user = await getUser(c)
  const rooms = await c.env.ROOMS_KV.list()

  if (!rooms.keys[0]) {
    console.log('creating room..')
    return await createRoom(c, category, user)
  }

  // Returns name only
  const foundRoom = rooms.keys.find(async (r: any) => {
    const roomString = await c.env.ROOMS_KV.get(r.name)
    const room = JSON.parse(roomString)
    const eloCheck =
      room.hostElo - user.object.rank.elo < 100 ||
      room.hostElo - user.object.rank.elo > 100
    if (room.category == category && room.users.length == 1 && eloCheck) {
      return
    }
  })
  return foundRoom.name
}

async function createRoom(c: Context, category: Category, user: any) {
  const userObject = user.object

  try {
    console.log(typeof category, typeof userObject.rank.elo, typeof user.id)
  } catch (e) {
    console.error(e)
  }

  const room: Room = {
    roomID: 123,
    category: category,
    hostElo: userObject.rank.elo,
    users: [user.id]
  }

  console.log(room)

  await c.env.ROOMS_KV.put(user.id, JSON.stringify(room))
  return user.id
}

async function createMatch(room: Room, __matchID: string) {
  // TODO:
  // Add matches to user schema
  // Maybe make it easier to sort by match date?

  const match: Match = {
    id: __matchID,
    category: room.category,
    ongoing: true,
    users: room.users,
    files: null,
    winner: null
  }
  await kv.set(['matches', __matchID], match)
}

export default app
