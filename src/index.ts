import { Context, Hono } from 'hono'
import { html } from 'hono/html'
import { HTTPException } from 'hono/http-exception'
import { getCookie, setCookie } from 'hono/cookie'
import { logger } from 'hono/logger'
import { Env } from 'hono'
import { nanoid } from 'nanoid'

import { Bindings, Room, Category } from './utils/types'
import { getUser, getUserByID } from './utils/user'
import Layout from './views/layout'
import Landing from './views/pages/Landing'
import matchmaker from './routes/matchmaker'
// import match from "./routes/match";
import auth from './routes/auth'
import user from './routes/user'
import {
  WebSocket,
  WebSocketRequestResponsePair
} from '@cloudflare/workers-types'

const app = new Hono<{ Bindings: Bindings }>()

app.use(logger())

app.route('/matchmaker', matchmaker)
// app.route("/match", match);
app.route('/auth', auth)
app.route('/user', user)

app.get('/', (c: Context) => {
  // return c.text('wow')
  return c.html(Layout({ title: 'Home', user: 'test', content: Landing() }))
})

app.notFound((c: Context) => {
  return c.text('Aw shucks, 404', 404)
})

app.onError((err: Error, c: Context) => {
  if (err instanceof HTTPException) {
    return err.getResponse()
  } else {
    return new Response()
  }
  // switch (err.status) {
  //   case 401: {
  //     return c.text("Not allowed, 401 >:(\n" + "Message: " + err.message);
  //   }
  // }
})

// List of rooms
// Unique players into rooms
// Communicate room status with each client
// Ready up and send redirect to match page

app.get('/durableHTMX', async (c: Context) => {
  const id = getCookie(c, 'id')
  const user = await getUser(c)
  return c.html(
    Layout({
      title: 'test',
      user: 'test',
      content: html`
        <button hx-swap="outerHTML" hx-get="/durableHTMX/ws">QUEUE</button>
      `
    })
  )
})

app.get('/durableHTMX/queue', (c: Context) => {
  return c.html(
    html`<button hx-swap="outerHTML" hx-get="/durableHTMX/ws">QUEUE</button>`
  )
})

app.get('/durableHTMX/ws', async (c: Context) => {
  // Automatically connects to WS || Button is for disconnecting
  return c.html(html`
    <div hx-ext="ws" hx-swap="outerHTML" id="queueTimerWrapper" ws-connect="/durable?&cat=physical">
      <button ws-send name="message" value="close" id="queueTimer">0:00</div>
    </div>
  `)
})

app.get('/durable', async (c: Context) => {
  // Check for authentication here before websocket

  let id = c.env.DURABLE_OBJECT.idFromName(1)
  let stub = c.env.DURABLE_OBJECT.get(id)
  let response = await stub.fetch(c.req.raw)
  return response
})

export class MyDurableObject implements DurableObject {
  constructor(
    public state: DurableObjectState,
    public env: Bindings,
    public roomQueue: any[]
  ) {
    this.state = state
    this.roomQueue = []
    this.env = env
  }

  async handleWebSocket(
    client: WebSocket,
    server: WebSocket,
    id: string,
    cat: Category,
    elo: number
  ) {
    server.accept()

    server.addEventListener('message', (event: MessageEvent) => {
      console.log('message received')
      console.log(event)

      // Queue up reponse
      if (JSON.parse(event.data as string).message === 'queue') {
        const r = this.searchForRoom(id, cat, elo).response
        if (r === 'madeRoom') {
          server.send(`<div id="queueTimer">00 : 00</div>`)
        } else if (r === 'foundRoom') {
          server.send('FOUND ROOM RESPONSE')
        }
      }
      // Close connection response
      if (JSON.parse(event.data as string).message === 'close') {
        server.close()
      }
    })

    return client
  }

  searchForRoom(id: string, cat: Category, elo: number) {
    if (this.roomQueue.length === 0) {
      this.makeRoom(id, cat, elo)
      return { reponse: 'madeRoom' }
    }
    for (let i = 0; i < this.roomQueue.length; i++) {
      const room = this.roomQueue[i]
      // Ommitting elo queueing rn
      if (room.users === 1 && room.cat === cat) {
        return { response: 'foundRoom' }
      }
    }
    this.makeRoom(id, cat, elo)
    return { reponse: 'madeRoom' }
  }

  makeRoom(id: string, cat: Category, elo: number) {
    const room: Room = {
      roomID: nanoid(10),
      category: cat,
      hostElo: elo,
      users: [id]
    }
    this.roomQueue.push(room)
  }

  async fetch(request: Request) {
    // Getting category info
    const c = request.headers.get('cookie') as string
    const id = this.getCookie('id', c)
    if (id === null) return new Response('no cookies')
    const url = new URL(request.url)
    const category = url.searchParams.get('cat') as string
    const user = await getUserByID(id, this.env)
    const elo = user.rank.elo

    if (!category || !elo) {
      console.error('Missing stuff')
      return new Response('Missing stuff')
    }

    // Handling WS
    const upgradeHeader = request.headers.get('Upgrade')
    if (upgradeHeader && upgradeHeader.toLowerCase() === 'websocket') {
      const webSocketPair = new WebSocketPair()
      const [client, server] = Object.values(webSocketPair)
      const wsClient = await this.handleWebSocket(
        client,
        server,
        id,
        category,
        elo
      )
      console.log('Returned websocket')
      return new Response(null, { status: 101, webSocket: wsClient })
    }

    return new Response('Not a WebSocket request', { status: 400 })
  }

  getCookie(cname: string, cookiestring: string) {
    if (cookiestring === null) return null
    let name = cname + '='
    let ca = cookiestring.split(';')
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i]
      while (c.charAt(0) == ' ') {
        c = c.substring(1)
      }
      if (c.indexOf(name) == 0) {
        return c.substring(name.length, c.length)
      }
    }
    return ''
  }
}

/// OLD

export class OldMyDurableObject {
  constructor(
    public physicalRooms: DurableObjectState,
    public digitalRooms: DurableObjectState,
    public env: Env
  ) {
    this.physicalRooms = physicalRooms
    this.digitalRooms = physicalRooms
  }

  async fetch(request: Request) {
    let url = new URL(request.url)
    const id = url.searchParams.get('id')
    const category = url.searchParams.get('cat')
    const elo = Number(url.searchParams.get('elo'))

    if (!id || !category || !elo) {
      console.error('Missing stuff')
      return new Response('Missing stuff')
    }

    const webSocketPair = new WebSocketPair()
    const [client, server] = Object.values(webSocketPair)
    server.accept()

    if (category === 'physical') {
      let suitableRoom: string | null = null
      let rooms: Map<string, Room> = await this.physicalRooms.storage.list()

      // Immediately if no rooms make a new one
      if (rooms.size === 0) {
        console.log('No rooms')
        const uid: string = nanoid(10)
        const newRoom: Room = {
          roomID: uid,
          category: Category.physical,
          hostElo: elo,
          users: [id]
        }
        await this.physicalRooms.storage.put(uid, newRoom)
        while (true) {
          const listenRoom = (await this.physicalRooms.storage.get(uid)) as Room
          if (listenRoom.users.length === 2) {
            server.send(
              '<div hx-swap-oob="beforeend:#message">Found Match</div>'
            )
          }
          return new Response(null, { status: 101, webSocket: client })
        }
      }

      // If there are rooms, finding a suitable room
      // Include logic for breaking if user already is in a room
      else if (rooms.size > 0) {
        console.log('Finding room...')
        rooms.forEach((r, key) => {
          if (
            r.users.length === 1 &&
            r.category === 'physical' &&
            r.users[0] !== id &&
            r.hostElo == 1000
          ) {
            console.log('Found suitable room')
            suitableRoom = key
            server.send(
              '<div hx-swap-oob="beforeend:#message">Found Match</div>'
            )
          }
        })
      }

      if (rooms.size > 0 && suitableRoom === null) {
        this.physicalRooms.storage.deleteAll()
        console.log('Some room, none good: making room')
        const uid: string = nanoid(10)
        const newRoom: Room = {
          roomID: uid,
          category: Category.physical,
          hostElo: elo,
          users: [id]
        }
        await this.physicalRooms.storage.put(uid, newRoom)
        while (true) {
          const listenRoom = (await this.physicalRooms.storage.get(uid)) as Room
          return new Response(null, { status: 101, webSocket: client })
          if (listenRoom.users.length === 2) {
            server.send(
              '<div hx-swap-oob="beforeend:#message">Found Match</div>'
            )
          }
        }
      }
      // No suitable rooms: make new room
    }

    server.send('<div hx-swap-oob="beforeend:#message">test</div>')

    return new Response(null, { status: 101, webSocket: client })
  }
}

export default app
