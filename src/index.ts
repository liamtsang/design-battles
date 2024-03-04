import { Context, Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { getCookie, setCookie } from 'hono/cookie'
import { logger } from 'hono/logger'
import { Bindings } from './utils/types'
import Layout from './views/layout'
import Landing from './views/pages/Landing'
import matchmaker from './routes/matchmaker'
// import match from "./routes/match";
import auth from './routes/auth'
import user from './routes/user'

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

export default app
