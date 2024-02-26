export enum Category {
  ui = "ui",
  graphic = "graphic",
  web = "web",
}

export interface OAuthProviderInfo {
  provider: string;
  id: string;
}

export interface Room {
  roomID: number;
  category: Category;
  hostElo: number;
  users: string[];
  status: string; // Added status field
}

// Accessed by username KV
export interface User {
  username: string;
  email: string;
  profile: UserProfile;
  preferences: UserPreferences;
  achievements: Achievement[];
  rank: UserRank;
  matchesPlayed: string[];
  lastLogin: Date;
  registrationDate: Date;
}

interface UserProfile {
  displayName: string;
  avatarUrl: string;
  biography: string;
  country: string;
}

interface UserRank {
  elo: number;
  rankTitle: string;
  rankLevel: number;
  league: string;
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  achievedDate: Date;
}

interface UserPreferences {
  theme: "light" | "dark";
  notifications: boolean;
  language: string;
  soundEffects: boolean;
}
