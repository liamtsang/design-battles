import { Hono, Context } from 'https://deno.land/x/hono@v4.0.3/mod.ts'
import Layout from './views/layout.ts'
import Landing from './views/pages/Landing.ts'
import matchmaker from './routes/matchmaker.ts'
import match from './routes/match.ts'
import auth from './routes/auth.ts'

const app = new Hono()

app.get('/', (c: Context) => {
  return c.html(Layout({title: 'Home', content: Landing() }))
})

app.route('/matchmaker', matchmaker)
app.route('/match', match)
app.route('/auth', auth)

Deno.serve(app.fetch)