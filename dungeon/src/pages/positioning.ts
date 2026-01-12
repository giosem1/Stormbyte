const canvas = document.getElementById("infinite-canvas") as HTMLDivElement;
const menuImages = document.querySelectorAll<HTMLImageElement>(".menu-item");

let draggingImage: HTMLImageElement | null = null;
let offsetX = 0;
let offsetY = 0;


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


menuImages.forEach(menuImg => {
  menuImg.addEventListener("mousedown", (e) => {
    if (e.button !== 0) return;
    e.preventDefault();

    const newImg = document.createElement("img");
    newImg.src = menuImg.src;
    newImg.classList.add("absolute", "select-none");
    newImg.draggable = false;

    const canvasRect = canvas.getBoundingClientRect();

    const x = e.clientX - canvasRect.left;
    const y = e.clientY - canvasRect.top;

    newImg.style.left = `${x}px`;
    newImg.style.top = `${y}px`;

    canvas.appendChild(newImg);

    enableDrag(newImg);

    draggingImage = newImg;
    offsetX = 0;
    offsetY = 0;
  });
});

window.addEventListener("mousemove", (e) => {
  if (!draggingImage) return;

  const canvasRect = canvas.getBoundingClientRect();

  const x = e.clientX - canvasRect.left - offsetX;
  const y = e.clientY - canvasRect.top - offsetY;

  draggingImage.style.left = `${x}px`;
  draggingImage.style.top = `${y}px`;
});


window.addEventListener("mouseup", () => {
  draggingImage = null;
});
