import { state, type PlacedItem, type DungeonSave, type RoomSave, type ItemSave } from "./state";

export function buildDungeonSave(): DungeonSave {
  const rooms = state.items.filter(i => i.type === "room");

  const roomSaves: RoomSave[] = rooms.map(room => {
    const enemies = state.items
      .filter(i => i.type === "enemy" && isInside(i, room))
      .map(i => toItemSave(i, room));

    const traps = state.items
      .filter(i => i.type === "trap" && isInside(i, room))
      .map(i => toItemSave(i, room));

    return {
      id: room.id,
      asset: room.src,
      x: room.x,
      y: room.y,
      width: room.width,
      height: room.height,
      enemies,
      traps
    };
  });

  return {
    version: 1,
    rooms: roomSaves
  };
}

function toItemSave(item: PlacedItem, room: PlacedItem): ItemSave {
  return {
    id: item.id,
    asset: item.src,
    name: item.name,
    x: item.x - room.x,
    y: item.y - room.y,
    width: item.width,
    height: item.height
  };
}

function isInside(item: PlacedItem, room: PlacedItem): boolean {
  return (
    item.x >= room.x &&
    item.y >= room.y &&
    item.x + item.width <= room.x + room.width &&
    item.y + item.height <= room.y + room.height
  );
}
