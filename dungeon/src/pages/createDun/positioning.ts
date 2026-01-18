import { state, type PlacedItem, type ItemType, type Command } from "./state";
import { updateCanvas } from "./movement";

const canvas = document.getElementById("infinite-canvas") as HTMLDivElement;

let draggingImage: HTMLImageElement | null = null;
let offsetX = 0;
let offsetY = 0;

const SCALE_RULES: Record<ItemType, number> = {
  room: 1,
  enemy: 0.35,
  trap: 0.4
};

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
  }

  undo() {
    state.items = state.items.filter(i => i.id !== this.item.id);
    this.element.remove();
  }
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
    if (collidesWithOtherRooms(item)) {
      draggingImage.remove();
      state.items = state.items.filter(i => i.id !== id);
      draggingImage = null;
      return;
    }
  }

  if (item.type !== "room") {
    const room = findContainingRoom(item);
    if (!room) {
      draggingImage.remove();
      state.items = state.items.filter(i => i.id !== id);
    }
  }

  draggingImage = null;
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

window.addEventListener("DOMContentLoaded", () => {
  spawnDefaultRoom();
});