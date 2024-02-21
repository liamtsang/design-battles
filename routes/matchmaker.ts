import { Hono, Context, HTTPException } from 'https://deno.land/x/hono@v4.0.3/mod.ts'
import { uid } from 'https://deno.land/x/usid/mod.ts'
import { Room, Category } from '../utils/types.ts'
import { getSessionId } from "https://deno.land/x/deno_kv_oauth@v0.10.0/mod.ts";
 
const app = new Hono()
let rooms: Room[] = []

app.get('/', async (c: Context) => {
  if (await getSessionId(c.req.raw) === undefined) throw new HTTPException(401, { message: 'Invalid Token'})
  
  const userUUID = c.req.header('X-User-UUID')
  const userElo: number = +c.req.header('X-User-Elo')
  const categoryHeaderValue = c.req.header('X-Category')

  // Check if category header value is provided and is of valid Category type
  if (
    !userUUID ||
    !userElo ||
    !categoryHeaderValue ||
    !(categoryHeaderValue in Category)
  ) {
    throw new HTTPException(401, {message: 'Missing user information'})
  }
  // Parse category header value to Category type
  const category: Category = categoryHeaderValue as Category

  // Remove empty rooms
  rooms = rooms.filter((room) => room.users.length > 0)

  // Check for rooms with available space and suitable Elo range
  const suitableRoom = rooms.find(
    (room) =>
      category == room.category &&
      room.users.length < 2 &&
      Math.abs(room.hostElo - userElo) < 100
  )

  if (suitableRoom) {
    suitableRoom.users.push(userUUID)
    suitableRoom.status = 'playing'
    if (suitableRoom.users.length === 2) {
      // Create match KV
      const __matchID = uid(6)
      await createMatch(suitableRoom, __matchID)
      suitableRoom.users = []
      return new Response('', {
        status: 307,
        headers: { Location: `/match/${__matchID}` }
      })
    } else {
      return c.text(`You have joined room: ${suitableRoom.roomID}`)
    }
  } else {
    // Create a new room
    const newRoom: Room = {
      roomID: rooms.length + 1,
      category: category,
      hostElo: userElo,
      users: [userUUID],
      status: 'waiting' // Set initial status to waiting
    }
    rooms.push(newRoom)
    return c.text(`You have created and joined room: ${newRoom.roomID}`)
  }
})

async function createMatch(room: Room, __matchID: string) {
  const kv = await Deno.openKv()
  const match = {
    category: room.category,
    status: 'playing',
    users: room.users,
    winner: null
  }
  await kv.set(['matches', __matchID], match)
}

export default app
