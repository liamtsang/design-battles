import { Context } from "https://deno.land/x/hono@v4.0.7/mod.ts";
import {
  deleteCookie,
  getCookie,
} from "https://deno.land/x/hono@v4.0.7/helper.ts";
import { User, UserPreferences, UserProfile, UserRank } from "./types.ts";

const kv = await Deno.openKv();

export async function verifySession(c: Context) {
  const sessionCookie = getCookie(
    c,
    "oauth_session",
  ) as string;
  if (!sessionCookie) {
    return false;
  }
  const sessionKv = await kv.get(["oauth_session", sessionCookie]);
  if (!sessionKv.value) {
    return false;
  } else if (sessionKv.value) {
    return true;
  }
}

export async function signOut(c: Context) {
  const sessionCookie = getCookie(
    c,
    "oauth_session",
  ) as string;
  if (sessionCookie) {
    await kv.delete(["oauth_session", sessionCookie]);
  }
  deleteCookie(c, "oauth_session");
  deleteCookie(c, "id");
  deleteCookie(c, "handle");
  return null;
}

export async function createUser(data: Object) {
  const user_id = data.id;
  const user_email = data.email;
  const user_handle = data.handle;
  const img_url = data.img_url;

  const UserProfile: UserProfile = {
    handle: user_handle,
    avatarUrl: img_url,
    biography: "",
    country: "",
  };

  const UserRank: UserRank = {
    elo: 1000,
    rankTitle: "Unranked",
    rankLevel: 0,
    league: "",
  };

  const UserPreferences: UserPreferences = {
    theme: "light",
    notifications: false,
  };

  const User: User = {
    handle: user_handle,
    email: user_email,
    profile: UserProfile,
    preferences: UserPreferences,
    rank: UserRank,
    matchesPlayed: [],
    registrationDate: new Date(Date.now()),
  };
  console.log("User Created: " + User);
  const _a = await kv.set(["user", user_id], User);
}
