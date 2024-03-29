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

export interface Match {
  id: string;
  ongoing: boolean;
  users: string[]; // Ids - could be User objects instead
  category: Category;
  files: object | null;
  winner: User | null;
}

// Accessed by ID KV
export interface User {
  // uniqueHandle: string;   <-- Implement later
  handle: string;
  email: string;
  profile: UserProfile;
  preferences: UserPreferences;
  // achievements: Achievement[];
  rank: UserRank;
  matchesPlayed: string[];
  // lastLogin: Date;
  registrationDate: Date;
}

export interface UserProfile {
  handle: string;
  avatarUrl: string;
  biography: string;
  country: string;
}

export interface UserRank {
  elo: number;
  rankTitle: string;
  rankLevel: number;
  league: string;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  achievedDate: Date;
}

export interface UserPreferences {
  theme: "light" | "dark";
  notifications: boolean;
}
