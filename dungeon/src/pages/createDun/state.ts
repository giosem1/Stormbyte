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

export interface Command {
  execute(): void;
  undo(): void;
}

export const state = {
  centerX: 0,
  centerY: 0,
  offsetX: 0,
  offsetY: 0,

  items: [] as PlacedItem[],

  undoStack: [] as Command[],
  redoStack: [] as Command[]
};
