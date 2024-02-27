import { Context, Hono, Next } from "https://deno.land/x/hono@v4.0.3/mod.ts";
import {
  deleteCookie,
  getCookie,
  html,
  setCookie,
} from "https://deno.land/x/hono@v4.0.3/helper.ts";
import {
  createGitHubOAuthConfig,
  getSessionId,
  handleCallback,
  signIn,
  signOut,
} from "https://deno.land/x/deno_kv_oauth@v0.10.0/mod.ts";
import {
  Cookie,
  setCookie as setDenoCookie,
} from "https://deno.land/std@0.217.0/http/cookie.ts";
import { HTTPException } from "https://deno.land/x/hono@v4.0.3/http-exception.ts";

import { OAuthProviderInfo } from "../utils/types.ts";
import { getGitHubUser } from "../utils/github.ts";
import {
  createUser,
  createUserByGithub,
  internalUserExists,
  oauthUserExists,
} from "../utils/user.ts";
import Layout from "../views/layout.ts";
import Onboard from "../views/pages/Onboard.ts";
import { CookieOptions } from "https://deno.land/x/hono@v4.0.3/utils/cookie.ts";

const oauthConfig = createGitHubOAuthConfig();
const app = new Hono();

app.get("/oauth/signin", async (c: Context) => {
  return await signIn(c.req.raw, oauthConfig);
});

app.get("/oauth/signout", (c: Context) => {
  // Not using proper signOut logic ! may cause issues
  deleteCookie(c, "requires-onboarding");
  deleteCookie(c, "site-session");
  deleteCookie(c, "internal-uid");
  return c.redirect("/");
});

app.get("/callback", async (c: Context) => {
  const { response, tokens } = await handleCallback(c.req.raw, oauthConfig);
  const gitHubUser = await getGitHubUser(tokens.accessToken);
  const o: OAuthProviderInfo = {
    provider: "github",
    id: gitHubUser.id,
  };
  // Should return a username or null & cookies should be username
  const exists = await oauthUserExists(o);
  // const exists = false;
  if (exists) {
    const cookie: Cookie = {
      name: "internal-uid",
      value: exists,
      path: "/",
      httpOnly: true,
      secure: true,
      sameSite: "Lax",
    };
    setDenoCookie(response.headers, cookie);
    return response;
  } else if (!exists) {
    const val = encodeURIComponent(JSON.stringify(o));
    const cookie: Cookie = {
      name: "requires-onboarding",
      value: val,
      path: "/",
      httpOnly: true,
      secure: true,
      sameSite: "Lax",
    };
    setDenoCookie(response.headers, cookie);
    return response;
  }
  return response;
});

// Onboarding | htmx form, POST username -> Check if valid -> Add user KV -> Redirect to signin
app.get("/onboard", (c: Context) => {
  return c.html(Layout({ title: "test", user: "", content: Onboard() }));
});

app.post("/onboard", async (c: Context) => {
  const body = await c.req.parseBody();
  const cookie = getCookie(c, "requires-onboarding");
  if (cookie === undefined) {
    console.log("No onboard cookie");
    c.header("HX-Redirect", `/auth/test/401`);
    c.status(204);
    return c.body(null);
  }
  const o: OAuthProviderInfo = JSON.parse(cookie as string);
  createUser(body["username"] as string, o);
  deleteCookie(c, "requires-onboarding");
  const cookieOptions: CookieOptions = {
    path: "/",
    httpOnly: true,
    secure: true,
    sameSite: "Lax",
  };
  setCookie(c, "internal-uid", body["username"] as string, cookieOptions);
  c.header("HX-Redirect", `/`);
  c.status(204);
  return c.body(null);
});

app.post("/username-exists", async (c: Context) => {
  const body = await c.req.parseBody();
  const username: string | File | (string | File)[] = body["username"];
  if (typeof username !== "string") {
    throw new HTTPException(422, { message: "Usernames can only be strings" });
  } else if (typeof username === "string") {
    // Maybe weed out weird characters
    // const exists = await internalUserExists(username);
    let exists = true;
    if (username === "valid") exists = false;
    if (exists) {
      return c.html(html`
        <div hx-target="this" hx-swap="outerHTML" class="error">
          <label>Username</label>
          <input name="username" hx-post="/auth/username-exists" hx-indicator="#ind" value=${username} aria-invalid="true" aria-required="true">
          <img id="ind" src="/img/bars.svg" class="htmx-indicator"/>
          <div class='error-message'>That username is already taken. Please enter another username.</div>
          <button disabled class="btn btn-default">Submit</button>
        </div>
      `);
    } else if (!exists) {
      return c.html(html`
        <div hx-target="this" hx-swap="outerHTML" class="">
          <label>Username</label>
          <input name="username" hx-post="/auth/username-exists" hx-indicator="#ind" value=${username} aria-invalid="false" aria-required="true">
          <img id="ind" src="/img/bars.svg" class="htmx-indicator"/>
          <button class="btn btn-default">Submit</button>
        </div>
      `);
    }
  }
});

app.get("/test/protected-route", async (c: Context) => {
  return await getSessionId(c.req.raw) === undefined
    ? new Response("Unauthorized", { status: 401 })
    : new Response("You are allowed");
});

app.get("/test/401", () => {
  throw new HTTPException(401);
});

app.get("/test/404", (c: Context) => {
  return c.status(404);
});

export default app;
