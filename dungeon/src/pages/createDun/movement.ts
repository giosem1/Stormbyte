import { state } from "./state";

const viewport = document.getElementById("viewport") as HTMLDivElement;
const canvas = document.getElementById("infinite-canvas") as HTMLDivElement;

let isDragging = false;
let startX = 0;
let startY = 0;
const KEYBOARD_SPEED = 20;


function updateCanvas(): void {
  canvas.style.transform = `translate(${state.offsetX}px, ${state.offsetY}px)`;
}

viewport.addEventListener("mousedown", (e) => {
  if (e.button !== 2) return;

  isDragging = true;
  startX = e.clientX;
  startY = e.clientY;
  e.preventDefault();
});

viewport.addEventListener("contextmenu", e => e.preventDefault());

window.addEventListener("mouseup", () => {
  isDragging = false;
});

window.addEventListener("mousemove", (e) => {
  if (!isDragging) return;

  state.offsetX += e.clientX - startX;
  state.offsetY += e.clientY - startY;

  startX = e.clientX;
  startY = e.clientY;

  updateCanvas();
});

window.addEventListener("keydown", (e) => {
  switch (e.key) {
    case "ArrowUp": state.offsetY += KEYBOARD_SPEED; break;
    case "ArrowDown": state.offsetY -= KEYBOARD_SPEED; break;
    case "ArrowLeft": state.offsetX += KEYBOARD_SPEED; break;
    case "ArrowRight": state.offsetX -= KEYBOARD_SPEED; break;
    default: return;
  }
  updateCanvas();
});
