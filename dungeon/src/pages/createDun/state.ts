export type ItemType = "room" | "enemy" | "trap";

export interface PlacedItem {
  id: string;
  src: string;
  type: ItemType;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ItemSave {
  id: string;
  asset: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface RoomSave {
  id: string;
  asset: string;
  x: number;
  y: number;
  width: number;
  height: number;
  enemies: ItemSave[];
  traps: ItemSave[];
}

export interface DungeonSave {
  version: 1;
  rooms: RoomSave[];
}

export interface Command {
  execute(): void;
  undo(): void;
}
export type UserColor = string;

export const state = {
  centerX: 0,
  centerY: 0,
  offsetX: 0,
  offsetY: 0,

  items: [] as PlacedItem[],

  undoStack: [] as Command[],
  redoStack: [] as Command[],
  activeLocks: new Map<string, UserColor>()
};
