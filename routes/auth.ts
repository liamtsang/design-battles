import { Context, Hono, Next } from "https://deno.land/x/hono@v4.0.3/mod.ts";
import {
  deleteCookie,
  getCookie,
  getSignedCookie,
  setCookie,
  setSignedCookie,
} from "https://deno.land/x/hono@v4.0.3/helper.ts";

const clientId = Deno.env.get("FIGMA_CLIENT_ID") as string;
const clientSecret = Deno.env.get("FIGMA_CLIENT_SECRET");
const redirectUri = "http://localhost:8000/auth/oauth/callback";
const scope = "files:read, file_comments:write, webhooks:write";

const app = new Hono();

app.get("/oauth/signin", async (c: Context) => {
  const state = crypto.randomUUID();
  const url =
    `https://www.figma.com/oauth?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}&state=${state}&response_type=code`;
  setCookie(c, "state", state);
  return c.redirect(url);
});

app.get("/oauth/signout", (c: Context) => {
});

app.get("/oauth/callback", async (c: Context) => {
  const code = c.req.query("code");
  const url =
    `https://www.figma.com/api/oauth/token?client_id=${clientId}&client_secret=${clientSecret}&redirect_uri=${redirectUri}&code=${code}&grant_type=authorization_code`;
  const response = await fetch(url, {
    method: "POST",
    mode: "cors",
    redirect: "follow",
  });
  const tokens = await response.json();
  // Token schema
  // user_id
  // access_token
  // refresh_token
  // expires_in
  console.log(tokens);

  return c.text(`${tokens.user_id}`);
});

app.get("/test/protected-route", async (c: Context) => {
});

export default app;
