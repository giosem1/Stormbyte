import { state, type PlacedItem, type ItemType, type Command } from "./state";
import { updateCanvas } from "./movement";

const canvas = document.getElementById("infinite-canvas") as HTMLDivElement;

let draggingImage: HTMLImageElement | null = null;
let offsetX = 0;
let offsetY = 0;

const SNAP_DISTANCE = 100;
type Side = "top" | "bottom" | "left" | "right";

const SCALE_RULES: Record<ItemType, number> = {
  room: 1,
  enemy: 1.2,
  trap: 1.8
};
const STORAGE_KEY = "canvas-items";

function saveItemsToStorage() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.items));
}

function loadItemsFromStorage(): PlacedItem[] {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as PlacedItem[];
  } catch {
    return [];
  }
}

class AddItemCommand implements Command {
  private item: PlacedItem;
  private element: HTMLImageElement;

  constructor(item: PlacedItem, element: HTMLImageElement) {
    this.item = item;
    this.element = element;
  }

  execute() {
    state.items.push(this.item);
    canvas.appendChild(this.element);
    saveItemsToStorage();
  }

  undo() {
    state.items = state.items.filter(i => i.id !== this.item.id);
    this.element.remove();
    saveItemsToStorage();
  }
}

function getSidePosition(item: PlacedItem, side: Side) {
  switch (side) {
    case "top":
      return { x: item.x + item.width / 2, y: item.y };
    case "bottom":
      return { x: item.x + item.width / 2, y: item.y + item.height };
    case "left":
      return { x: item.x, y: item.y + item.height / 2 };
    case "right":
      return { x: item.x + item.width, y: item.y + item.height / 2 };
  }
}

function trySnap(moving: PlacedItem): boolean {
  const rooms = state.items.filter(i => i.type === "room" && i.id !== moving.id);

  for (const target of rooms) {
    const pairs: [Side, Side, (t: PlacedItem) => { x: number; y: number }][] = [
      ["left", "right", t => ({ x: t.x + t.width, y: t.y })],
      ["right", "left", t => ({ x: t.x - moving.width, y: t.y })],
      ["top", "bottom", t => ({ x: t.x, y: t.y + t.height })],
      ["bottom", "top", t => ({ x: t.x, y: t.y - moving.height })],
    ];

    for (const [a, b, snapPos] of pairs) {
      const p1 = getSidePosition(moving, a);
      const p2 = getSidePosition(target, b);

      const dx = Math.abs(p1.x - p2.x);
      const dy = Math.abs(p1.y - p2.y);

      if (dx < SNAP_DISTANCE && dy < SNAP_DISTANCE) {
        const pos = snapPos(target);
        moving.x = pos.x;
        moving.y = pos.y;
        return true;
      }
    }
  }

  return false;
}

function spawnDefaultRoom() {
  const src = "public/assets/rooms/loginroom.png";
  const img = document.createElement("img");
  img.src = src;
  img.classList.add("absolute", "select-none", "room-dynamic");
  img.draggable = false;

  img.onload = () => {
    const scale = SCALE_RULES.room;
    const width = img.naturalWidth * scale;
    const height = img.naturalHeight * scale;

    const x = -width / 2;
    const y = -height / 2;

    img.style.width = `${width}px`;
    img.style.height = `${height}px`;
    img.style.left = `${x}px`;
    img.style.top = `${y}px`;

    const item: PlacedItem = {
      id: crypto.randomUUID(),//TODO: Change uid
      src,
      type: "room",
      x,
      y,
      width,
      height
    };

    img.dataset.id = item.id;

    const command = new AddItemCommand(item, img);
    command.execute();

    state.undoStack.push(command);

    updateCanvas();
    enableDrag(img, item);
  };
}

function getItemType(src: string): ItemType {
  if (src.includes("/rooms/")) return "room";
  if (src.includes("/enemis/")) return "enemy";
  return "trap";
}

function isInside(item: PlacedItem, room: PlacedItem): boolean {
  return (
    item.x >= room.x &&
    item.y >= room.y &&
    item.x + item.width <= room.x + room.width &&
    item.y + item.height <= room.y + room.height
  );
}

function findContainingRoom(item: PlacedItem): PlacedItem | null {
  return (
    state.items
      .filter(i => i.type === "room")
      .find(room => isInside(item, room)) ?? null
  );
}

document.addEventListener("mousedown", (e) => {
  const target = e.target as HTMLElement;
  if (!target.classList.contains("menu-item")) return;
  if (e.button !== 0) return;

  const img = target as HTMLImageElement;
  const type = getItemType(img.src);
  const scale = SCALE_RULES[type];

  const card = img.parentElement;
  let labelText = "";
  if (card) {
    const label = card.querySelector<HTMLSpanElement>("span#itemName");
    if (label) labelText = label.textContent || "";
  }

  const newImg = document.createElement("img");
  newImg.src = img.src;
  newImg.classList.add("absolute", "select-none");
  if (type === "room") {
    newImg.classList.add("room-dynamic");
  }else if (type === "enemy"){ 
    newImg.classList.add("enemy-dynamic")
  }else if (type === "trap"){
    newImg.classList.add("trap-dynamic");
  } 
  newImg.draggable = false;

  newImg.style.width = `${img.naturalWidth * scale}px`;
  newImg.style.height = `${img.naturalHeight * scale}px`;

  const canvasRect = canvas.getBoundingClientRect();
  newImg.style.left = `${e.clientX - canvasRect.left}px`;
  newImg.style.top = `${e.clientY - canvasRect.top}px`;

  const width = img.naturalWidth * scale;
  const height = img.naturalHeight * scale;
  const item: PlacedItem = {
    id: crypto.randomUUID(),
    src: newImg.src,
    type,
    name: labelText,
    x: parseFloat(newImg.style.left),
    y: parseFloat(newImg.style.top),
    width,
    height
  };
  enableDrag(newImg, item);
  newImg.dataset.id = item.id;
  
  const command = new AddItemCommand(item, newImg);
  command.execute();

  state.undoStack.push(command);
  state.redoStack.length = 0;
  e.preventDefault();

  draggingImage = newImg;
});

function enableDrag(img: HTMLImageElement, item: PlacedItem) {
  img.addEventListener("mousedown", (e) => {
    if (e.button !== 0) return;
    e.preventDefault();

    const rect = img.getBoundingClientRect();
    offsetX = e.clientX - rect.left;
    offsetY = e.clientY - rect.top;

    draggingImage = img;
    setActiveRoom(item);
  });
}

window.addEventListener("mousemove", (e) => {
  if (!draggingImage) return;

  const canvasRect = canvas.getBoundingClientRect();
  const x = e.clientX - canvasRect.left - offsetX;
  const y = e.clientY - canvasRect.top - offsetY;

  draggingImage.style.left = `${x}px`;
  draggingImage.style.top = `${y}px`;

  const id = draggingImage.dataset.id!;
  const item = state.items.find(i => i.id === id);
  if (item) {
    item.x = x;
    item.y = y;
  }
});

window.addEventListener("mouseup", () => {
  if (!draggingImage) return;

  const id = draggingImage.dataset.id!;
  const item = state.items.find(i => i.id === id)!;

  if (item.type === "room") {
    const snapped = trySnap(item);

    if (!snapped && state.items.filter(i => i.type === "room").length > 1) {
      draggingImage.remove();
      state.items = state.items.filter(i => i.id !== id);
      draggingImage = null;
      return;
    }

    if (collidesWithOtherRooms(item)) {
      draggingImage.remove();
      state.items = state.items.filter(i => i.id !== id);
      draggingImage = null;
      return;
    }

    draggingImage.style.left = `${item.x}px`;
    draggingImage.style.top = `${item.y}px`;
  }


  if (item.type !== "room") {
    const room = findContainingRoom(item);
    if (!room) {
      draggingImage.remove();
      state.items = state.items.filter(i => i.id !== id);
    }
  }

  draggingImage = null;
  saveItemsToStorage();
});

function isOverlapping(a: PlacedItem, b: PlacedItem): boolean {
  return !(
    a.x + a.width <= b.x ||
    a.x >= b.x + b.width ||
    a.y + a.height <= b.y ||
    a.y >= b.y + b.height
  );
}

function collidesWithOtherRooms(item: PlacedItem): boolean {
  return state.items
    .filter(i => i.type === "room" && i.id !== item.id)
    .some(room => isOverlapping(item, room));
}

window.addEventListener("keydown", e => {
  if (e.ctrlKey && e.key === "z") {
    const cmd = state.undoStack.pop();
    if (!cmd) return;
    cmd.undo();
    state.redoStack.push(cmd);
  }

  if (e.ctrlKey && e.key === "y") {
    const cmd = state.redoStack.pop();
    if (!cmd) return;
    cmd.execute();
    state.undoStack.push(cmd);
  }
});

function setActiveRoom(item: PlacedItem) {
  document
    .querySelectorAll("."+item.type+"-dynamic")
    .forEach(el => el.classList.remove("active-"+item.type));

  const el = document.querySelector(
    `[data-id="${item.id}"]`
  ) as HTMLElement;

  if (el) el.classList.add("active-"+item.type);
}

function clearDungeonEditorState() {
  state.items = [];
  state.undoStack.length = 0;
  state.redoStack.length = 0;

  canvas.innerHTML = "";
  localStorage.removeItem("canvas-items");
  localStorage.removeItem("dungeonCode");
}

const backArrow = document.getElementById("back-arrow");
backArrow?.addEventListener("click", () => { clearDungeonEditorState(); });

window.addEventListener("DOMContentLoaded", () => {
  const savedItems = loadItemsFromStorage();

  if (savedItems.length === 0) {
    spawnDefaultRoom();
    return;
  }

  savedItems.forEach(item => {
    const img = document.createElement("img");
    img.src = item.src;
    img.classList.add("absolute", "select-none", `${item.type}-dynamic`);
    img.draggable = false;

    img.style.width = `${item.width}px`;
    img.style.height = `${item.height}px`;
    img.style.left = `${item.x}px`;
    img.style.top = `${item.y}px`;

    img.dataset.id = item.id;

    canvas.appendChild(img);
    state.items.push(item);
    enableDrag(img, item);
  });

  updateCanvas();
});
