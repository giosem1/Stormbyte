export interface Friend {
  uid: string;
  username: string;
  profImg: string;
}
export interface User {
    [x: string]: any;
    uid: string,
    username: string,
    password: string,
    classe: string,
    profileImage?: string,
    friends: Friend[]
    inventory?: any[],
    dungeons?: Dungeon[],
}

export interface Dungeon{
    _id: string,
    code: string,
    name: string,
    owner: string,
    collaborators: string[],
    rooms: RoomSave[];
}


export type ItemType = "room" | "enemy" | "trap";

export interface PlacedItem {
  id: string;
  src: string;
  type: ItemType;
  name?: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ItemSave {
  id: string;
  asset: string;
  name?: string;
  x: number;
  y: number;
  width: number;
  height: number;
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

export const TRAP_CONFIG = {
  Spike: {
    idle: "spk_idle",
    anim: "spikeActivate"
  },
  Fire: {
    idle: "fir_idle",
    anim: "fireActivate"
  },
  BearTrap: {
    idle: "brt_idle",
    anim: "beartActivate"
  }
}
export const ENEMY_CONFIG = {
  default: {
    idle: "enemy_idle",
    alert: "enemy_alert",
    attack: "enemy_attack",
    alertRange: 150,
    alertDuration: 400
  }
};


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

export interface DungeonSave {
  name: string;
  version: number;
  rooms: RoomSave[];
}

export type PlayerClass = "Knight" | "Mage" | "Archer";
export const PREVIEW_TO_CLASS: Record<string, PlayerClass> = {
  knight: "Knight",
  mage: "Mage",
  archer: "Archer"
};

export type DungeonItem = {
  rotation: any;
  id: string;
  type: "room" | "enemy" | "trap";
  x: number;
  y: number;
};

export type DungeonState = {
  items: DungeonItem[];
};

export type Lobby = {
  dungeonCode: string;
  ownerId: string;
  users: string[];
  state: DungeonState;
  createdAt: number;
};