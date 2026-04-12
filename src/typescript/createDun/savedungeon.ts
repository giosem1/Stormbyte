import { state, type PlacedItem, type DungeonSave } from "./state";
import type { Dungeon, RoomSave, TrapSave, ItemSave} from "../../types/types";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const dungeonNameInput = document.getElementById(
  "dungeon-name-input"
) as HTMLInputElement;

const codeDungeon = document.getElementById(
  "code-label"
) as HTMLParagraphElement;

export function buildDungeonSave(owner: string, invited: string[]): DungeonSave {

  const dungeonName = dungeonNameInput.value.trim();
  const dungeonCode = codeDungeon.textContent
    ?.replace("Codice:", "")
    .trim() ?? "";

  const rooms = state.items.filter(i => i.type === "room");

  const roomSaves: RoomSave[] = rooms.map(room => {
   const enemies = state.items
    .filter(i => i.type === "enemy" && isInside(i, room))
    .map(i => toItemSave(i, room));

  const traps: TrapSave[] = state.items
    .filter(i => i.type === "trap" && isInside(i, room))
    .map(i => ({ ...toItemSave(i, room), name: i.name as "Spike" | "Fire" | "BearTrap" }));


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

  const _id= crypto.randomUUID()
  const code = dungeonCode
  const name = dungeonName
  const collaborators: string[]= invited
  const dungeon: Dungeon = {
    _id,
    code,
    name,
    owner,
    collaborators,
    rooms: roomSaves
  }

  saveDungeon(dungeon)
  return {
    _id,
    code,
    name,
    version: 1,
    rooms: roomSaves,
    createdAt: new Date().toISOString()
  };
}

export async function saveDungeon(data: Dungeon) {
  const response = await fetch(`${API_BASE_URL}/save_dungeon`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(data)
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || "Errore di salvataggio");
  }

  return result;
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
