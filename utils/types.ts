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

export interface User {
  id: string;
  username: string;
}
