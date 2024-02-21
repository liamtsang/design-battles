import { Hono, Context } from 'https://deno.land/x/hono@v4.0.3/mod.ts'
import {
  createGitHubOAuthConfig,
  getSessionId,
  handleCallback,
  signIn,
  signOut,
} from "https://deno.land/x/deno_kv_oauth@v0.10.0/mod.ts";
import { getGitHubUser } from '../utils/github.ts'

const oauthConfig = createGitHubOAuthConfig();

const app = new Hono();

app.get("/oauth/signin", async (c: Context) => {
  return await signIn(c.req.raw, oauthConfig);
});

app.get("/another-dir/callback", async (c: Context) => {
  const { response, tokens } = await handleCallback(c.req.raw, oauthConfig);
  const gitHubUser = await getGitHubUser(tokens.accessToken)
  console.log(gitHubUser);
  return response;
});

app.get("/oauth/signout", async (c: Context) => {
  return await signOut(c.req.raw);
});

app.get("/protected-route", async (c: Context) => {
  return await getSessionId(c.req.raw) === undefined
    ? new Response("Unauthorized", { status: 401 })
    : new Response("You are allowed");
});

export default app
