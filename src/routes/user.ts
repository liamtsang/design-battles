import { Context, Hono } from 'hono'
import Layout from '../views/layout'
import Profile from '../views/pages/Profile'
import { User, Bindings } from '../utils/types'

const app = new Hono<{ Bindings: Bindings }>()

app.get('/:id/profile', async (c: Context) => {
  const id = c.req.param('id')
  let u
  try {
    u = await c.env.USER_KV.get(id as string)
  } catch (e) {
    console.error(e)
  }
  console.log(u)
  const user: User = JSON.parse(u) as User

  return c.html(
    Layout({ title: 'Liam Profile', user: 'liam', content: Profile(user) })
  )
})

export default app
