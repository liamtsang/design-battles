export enum Category {
  ui = 'ui',
  graphic = 'graphic',
  web = 'web'
}

export interface Room {
  roomID: number;
  category: Category
  hostElo: number; 
  users: string[];
  status: string; // Added status field
}