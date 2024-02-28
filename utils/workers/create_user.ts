import { User, UserPreferences, UserProfile, UserRank } from "../types.ts";

// @ts-ignore: Web worker types are not cool
self.onmessage = async (e) => {
  const kv = await Deno.openKv();

  const user_id = e.data.user.id;
  const user_email = e.data.user.email;
  const user_handle = e.data.user.handle;
  const img_url = e.data.user.img_url;

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

  kv.set(["users", user_id], User);

  self.close();
};
