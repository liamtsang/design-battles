import { load } from "https://deno.land/std/dotenv/mod.ts";
import { Context, Hono, Next } from "https://deno.land/x/hono@v4.0.7/mod.ts";
import { bearerAuth } from "https://deno.land/x/hono/middleware.ts";
import {
  deleteCookie,
  getCookie,
  getSignedCookie,
  setCookie,
  setSignedCookie,
} from "https://deno.land/x/hono@v4.0.7/helper.ts";
import { HTTPException } from "https://deno.land/x/hono@v4.0.7/http-exception.ts";

const configData = await load({
  export: true,
  allowEmptyValues: true,
});

const clientId = Deno.env.get("FIGMA_CLIENT_ID") as string;
const clientSecret = Deno.env.get("FIGMA_CLIENT_SECRET");
const cookieSecret = "36b8f84d-df4e-4d49-b662-bcde71a8764f";
const redirectUri = "http://localhost:8000/auth/oauth/callback";
const scope = "files:read, file_comments:write, webhooks:write";

const app = new Hono();
const kv = await Deno.openKv();

app.get("/oauth/signin", (c: Context) => {
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

  const state = c.req.query("state");
  const stateCookie = getCookie(c, "state");
  if (state !== stateCookie) {
    throw new HTTPException(402, { message: "State does not match." });
  }

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

  // KV for accessing tokens
  const sessionKey = crypto.randomUUID();
  await kv.set(["oauth_session", sessionKey], tokens.access_token);

  // Probably insecure exposes token
  await setSignedCookie(c, "oauth_session", sessionKey, cookieSecret, {
    httpOnly: true,
    secure: true,
    sameSite: "Strict",
    maxAge: tokens.expires_in,
  });

  const r = await fetch("https://api.figma.com/v1/me", {
    method: "GET",
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });

  const user = await r.json();

  setCookie(c, "id", user.id, {
    expires: new Date(2030, 12),
  });
  setCookie(c, "handle", user.handle, {
    expires: new Date(2030, 12),
  });
  deleteCookie(c, "state");
  // User Schema
  // id
  // email
  // handle
  // img_url

  // Build user KV

  const worker = new Worker(
    new URL("../utils/workers/create_user.ts", import.meta.url).href,
    { type: "module" },
  );

  worker.postMessage({
    user: user,
  });

  return c.html(`${user.id} ${user.handle} ${user.img_url}`);
});

app.get("/test/protected-route", async (c: Context) => {
  const sessionCookie = await getSignedCookie(
    c,
    cookieSecret,
    "oauth_session",
  ) as string;
  const sessionKv = await kv.get(["oauth_session", sessionCookie]);
  console.log(sessionCookie);
  console.log(sessionKv.value);
  if (!sessionKv.value) {
    throw new HTTPException(401, { message: "Invalid session token" });
  }
  return c.text("Protected route");
});

export default app;
