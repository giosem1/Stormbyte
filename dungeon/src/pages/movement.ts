import { state } from './state';

const viewport = document.getElementById("viewport") as HTMLDivElement;
const canvas = document.getElementById("infinite-canvas") as HTMLDivElement;

let isDragging = false;
let startX = 0;
let startY = 0;
const KEYBOARD_SPEED = 20;

function updateCanvas() {
  canvas.style.transform = `translate(${state.offsetX}px, ${state.offsetY}px)`;
}

window.addEventListener("load", () => {
  const vw = viewport.clientWidth;
  const vh = viewport.clientHeight;

  const firstRoom = canvas.querySelector(".room-wrapper") as HTMLDivElement;
  const roomRect = firstRoom.getBoundingClientRect();

  state.offsetX = (vw / 2) - (roomRect.width / 2);
  state.offsetY = (vh / 2) - (roomRect.height / 2);

  updateCanvas();
});

viewport.addEventListener("mousedown", (e: MouseEvent) => {
  if (e.button !== 1) return; 
  isDragging = true;
  startX = e.clientX;
  startY = e.clientY;
  e.preventDefault();
});

viewport.addEventListener("contextmenu", (e: MouseEvent) => {
  e.preventDefault();
});

window.addEventListener("mouseup", () => isDragging = false);

window.addEventListener("mousemove", (e: MouseEvent) => {
  if (!isDragging) return;
  const dx = e.clientX - startX;
  const dy = e.clientY - startY;
  state.offsetX += dx;
  state.offsetY += dy;
  startX = e.clientX;
  startY = e.clientY;
  updateCanvas();
});

window.addEventListener("keydown", (e: KeyboardEvent) => {
  switch(e.key){
    case "ArrowUp": state.offsetY += KEYBOARD_SPEED; break;
    case "ArrowDown": state.offsetY -= KEYBOARD_SPEED; break;
    case "ArrowLeft": state.offsetX += KEYBOARD_SPEED; break;
    case "ArrowRight": state.offsetX -= KEYBOARD_SPEED; break;
    default: return;
  }
  updateCanvas();
});
