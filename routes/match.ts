import { Context, Hono } from "https://deno.land/x/hono@v4.0.3/mod.ts";
import { HTTPException } from "https://deno.land/x/hono@v4.0.3/http-exception.ts";
import { Match } from "../utils/types.ts";

const app = new Hono();
const kv = await Deno.openKv();

app.get("/:matchID", async (c: Context) => {
  // If it is a new match validate that it is the users

  const matchID = c.req.param("matchID");
  const matchInfo = await kv.get(["matches", matchID]);
  if (matchInfo.versionstamp === null) {
    return c.status(404);
  }
  const matchJSON = JSON.stringify(matchInfo);
  return c.text(
    `Welcome to the match page for match: ${matchID} info: ${matchJSON}`,
  );
});

export default app;
