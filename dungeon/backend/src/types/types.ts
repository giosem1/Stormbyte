export interface Friend {
    username: string,
    uid: string,
    profImg?: string
}

export interface User {
  uid: string;
  username: string;
  passwordHash: string;
  classe: string;
  profileImage?: string;
  friends: Friend[];
  inventory: any[];
  dungeons: {
    id: string;
    code: string;
    name: string;
    blobUrl?: string;
  }[];
}

export interface RoomSave {
  id: string;
  asset: string;
  x: number;
  y: number;
  width: number;
  height: number;
  enemies: EnemySave[];
  traps: TrapSave[];
}
export interface EnemySave {
  id: string;
  asset: string;
  x: number;
  y: number;
}

export interface TrapSave {
  id: string;
  asset: string;
  name: "Spike" | "Fire" | "BearTrap",
  x: number;
  y: number;
}