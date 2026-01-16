const canvas = document.getElementById("infinite-canvas") as HTMLDivElement;

let draggingImage: HTMLImageElement | null = null;
let offsetX = 0;
let offsetY = 0;

document.addEventListener("mousedown", (e) => {
  const target = e.target as HTMLElement;
  if (!target.classList.contains("menu-item")) return;

  if (e.button !== 0) return;
  e.preventDefault();

  const img = target as HTMLImageElement;
  const newImg = document.createElement("img");

  newImg.src = img.src;
  newImg.classList.add("absolute", "select-none");
  newImg.draggable = false;

  const canvasRect = canvas.getBoundingClientRect();
  newImg.style.left = `${e.clientX - canvasRect.left}px`;
  newImg.style.top = `${e.clientY - canvasRect.top}px`;

  canvas.appendChild(newImg);
  enableDrag(newImg);

  draggingImage = newImg;
});

function enableDrag(img: HTMLImageElement) {
  img.addEventListener("mousedown", (e) => {
    if (e.button !== 0) return;
    e.preventDefault();

    const rect = img.getBoundingClientRect();
    offsetX = e.clientX - rect.left;
    offsetY = e.clientY - rect.top;

    draggingImage = img;
  });
}

window.addEventListener("mousemove", (e) => {
  if (!draggingImage) return;

  const canvasRect = canvas.getBoundingClientRect();
  draggingImage.style.left = `${e.clientX - canvasRect.left - offsetX}px`;
  draggingImage.style.top = `${e.clientY - canvasRect.top - offsetY}px`;
});

window.addEventListener("mouseup", () => {
  draggingImage = null;
});
