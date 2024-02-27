import { Context, Hono, Next } from "https://deno.land/x/hono@v4.0.3/mod.ts";

import { load } from "https://deno.land/std/dotenv/mod.ts";
import {
  getRequiredEnv,
  getSessionId,
  handleCallback,
  type OAuth2ClientConfig,
  signIn,
  signOut,
} from "https://deno.land/x/deno_kv_oauth@v0.10.0/mod.ts";

const configData = await load({
  export: true,
  allowEmptyValues: true,
});

const oauthConfig: OAuth2ClientConfig = {
  clientId: getRequiredEnv("FIGMA_CLIENT_ID"),
  clientSecret: getRequiredEnv("FIGMA_CLIENT_SECRET"),
  authorizationEndpointUri: "https://www.figma.com/oauth",
  tokenUri: "https://www.figma.com/api/oauth/token",
  redirectUri: "https://design-battles.deno.dev/auth/oauth/callback",
  defaults: {
    scope: "files:read, file_comments:write, webhooks:write",
  },
};

const app = new Hono();

app.get("/oauth/signin", async (c: Context) => {
  return await signIn(c.req.raw, oauthConfig);
});

app.get("/oauth/signout", (c: Context) => {
  return signOut(c.req.raw);
});

app.get("/oauth/callback", async (c: Context) => {
  console.log("Before callback");
  console.log(c.req.raw);
  const { response, tokens, sessionId } = await handleCallback(
    c.req.raw,
    oauthConfig,
  );
  console.log("After callback");
  console.log(response);
  return response;
});

app.get("/test/protected-route", async (c: Context) => {
  return await getSessionId(c.req.raw) === undefined
    ? new Response("Unauthorized", { status: 401 })
    : new Response("You are allowed");
});

export default app;
