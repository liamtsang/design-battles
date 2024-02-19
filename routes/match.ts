import { Hono, Context } from 'https://deno.land/x/hono@v4.0.3/mod.ts'

const app = new Hono()
const kv = await Deno.openKv()

app.get('/:matchID', async (c: Context) => {
  const matchID = c.req.param('matchID');
  const matchInfo = await kv.get(["matches", matchID])
  const matchJSON = JSON.stringify(matchInfo)
  return c.text(`Welcome to the match page for match: ${matchID} info: ${matchJSON}`);
});

export default app