import { Hono, Context } from 'https://deno.land/x/hono@v4.0.3/mod.ts'
import {
  getRequiredEnv,
  getSessionId,
  handleCallback,
  type OAuth2ClientConfig,
  signIn,
  signOut,
} from "https://deno.land/x/deno_kv_oauth@v0.10.0/mod.ts";

const oauthConfig: OAuth2ClientConfig = {
  clientId: getRequiredEnv("GITHUB_CLIENT_ID"),
  clientSecret: getRequiredEnv("GITHUB_CLIENT_SECRET"),
  authorizationEndpointUri: "https://github.com/oauth/authorize?scope=user:email",
  tokenUri: "https://github.com/oauth/token",
};

async function handler(request: Request) {
  const { pathname } = new URL(request.url);
  switch (pathname) {
    case "/oauth/signin":
      return await signIn(request, oauthConfig);
    case "/another-dir/callback":
      const { response } = await handleCallback(request, oauthConfig);
      return response;
    case "/oauth/signout":
      return await signOut(request);
    case "/protected-route":
      return await getSessionId(request) === undefined
        ? new Response("Unauthorized", { status: 401 })
        : new Response("You are allowed");
    default:
      return new Response(null, { status: 404 });
  }
}

const app = new Hono();

app.get("/oauth/signin", async (c: Context) => {
  return await signIn(c.req.raw, oauthConfig);
});

export default app