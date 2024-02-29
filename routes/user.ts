import { Context, Hono } from "https://deno.land/x/hono@v4.0.7/mod.ts";
import Layout from "../views/layout.ts";
import Profile from "../views/pages/Profile.ts";
import { User } from "../utils/types.ts";
import { assert } from "https://deno.land/std@0.204.0/assert/assert.ts";

const app = new Hono();
const kv = await Deno.openKv();

app.get("/:id/profile", async (c: Context) => {
  const id = c.req.param("id");
  const u = await kv.get(["user", id]);
  const user: User = u.value as User;

  return c.html(
    Layout({ title: "Liam Profile", user: "liam", content: Profile(user) }),
  );
});

export default app;
