import { Context, Hono, Next } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { getCookie } from 'hono/cookie'
import { html } from 'hono/html'
import { stream, streamSSE, streamText } from 'hono/streaming'
import { Category, Match, Room, User, Bindings } from '../utils/types'
import { verifySession } from '../utils/auth'
import { getUser } from '../utils/user'
import Layout from '../views/layout'

const app = new Hono<{ Bindings: Bindings }>()

// User ROOMS_KV for room management

app.get('/ssetest', async (c: Context) => {
  return c.html(
    Layout({
      title: 'test',
      user: 'test',
      // On start swap htmx for sse
      content: html`
        <div hx-ext="sse" sse-connect="/matchmaker/sse" sse-swap="time-update">
          placeholder
        </div>
      `
    })
  )
})

let i = 0

app.get('/sse', async (c: Context) => {
  const user = await getUser(c)

  const searchResponse = searchForRoom(
    'web' as Category,
    user[1] as User,
    user[0]
  )

  // Room schema
  // key: "?" value: "init user id?"
  // Include: array of users, category, host elo, status

  return streamSSE(c, async (stream: any) => {
    // While loop to return blank / timer when room.users == 1
    // Re-read room and return ready up when room.users == 2
    while (true) {
      const message = `${new Date().toISOString()}`
      await stream.writeSSE({
        event: 'time-update',
        // data: message,
        data: String(i++)
      })
      await stream.sleep(1000)
    }
  })
})

// Extract match making functionality from this and move to a ready up route
async function searchForRoom(category: Category, user: User, userId: string) {}

async function createMatch(room: Room, __matchID: string) {
  // TODO:
  // Add matches to user schema
  // Maybe make it easier to sort by match date?

  // !!!! !!!! const kv = await Deno.openKv();
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
