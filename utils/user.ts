import { useDeferredValue } from "https://deno.land/x/hono@v4.0.4/jsx/hooks/index.ts";
import { OAuthProviderInfo, User } from "./types.ts";
import { uid } from "https://deno.land/x/usid/mod.ts";

// KV pairs
// By internal ID
// By githubID

// Login callback -> Check user by oauth -if new-> Get username -> CreateUser

const kv = await Deno.openKv();

export async function oauthUserExists(oauth: OAuthProviderInfo) {
  switch (oauth.provider) {
    case "github": {
      const githubKey = ["users_by_github", oauth.id];
      const res = await kv.get(githubKey);
      if (res.value) return true;
      else if (!res.value) return false;
      break;
    }
    case "": {
      break;
    }
  }
}

export async function internalUserExists(id: string) {
  return true;
}

export async function createUser(username: string, oauth?: OAuthProviderInfo) {
}
