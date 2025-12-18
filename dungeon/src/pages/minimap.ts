const miniMapCanvas = document.getElementById("mini-map-canvas") as HTMLCanvasElement;
const miniMapCtx = miniMapCanvas.getContext("2d");
const viewport = document.getElementById("viewport") as HTMLDivElement;

const rooms = document.querySelectorAll<HTMLElement>(".room-wrapper, .room");

const MIN_SIZE = 6;
const MAX_RATIO = 0.4;
function drawMiniMap() {
  if (!miniMapCtx) return;

  miniMapCtx.clearRect(0, 0, miniMapCanvas.width, miniMapCanvas.height);

  const centerX = miniMapCanvas.width / 2;
  const centerY = miniMapCanvas.height / 2;

  rooms.forEach(room => {
    const rect = room.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;

    const scaleW = (miniMapCanvas.width * MAX_RATIO) / w;
    const scaleH = (miniMapCanvas.height * MAX_RATIO) / h;

    let drawW = w * scaleW;
    let drawH = h * scaleH;

    if (drawW < MIN_SIZE) drawW = MIN_SIZE;
    if (drawH < MIN_SIZE) drawH = MIN_SIZE;

    // posizione centrata nella mini-mappa
    const x = centerX - drawW / 2;
    const y = centerY - drawH / 2;

    if (room instanceof HTMLImageElement) {
      miniMapCtx.drawImage(room, x, y, drawW, drawH);
    } else {
      miniMapCtx.fillRect(x, y, drawW, drawH);
    }
  });

  const scaleVW = (miniMapCanvas.width * MAX_RATIO) / viewport.clientWidth;
  const scaleVH = (miniMapCanvas.height * MAX_RATIO) / viewport.clientHeight;
  const viewportScale = Math.min(scaleVW, scaleVH);

  const vw = viewport.clientWidth * viewportScale;
  const vh = viewport.clientHeight * viewportScale;

  const rectX = centerX - vw / 2;
  const rectY = centerY - vh / 2;

  miniMapCtx.lineWidth = 2;
  miniMapCtx.strokeRect(rectX, rectY, vw, vh);
}

function updateMiniMap() {
  drawMiniMap();
  requestAnimationFrame(updateMiniMap);
}

updateMiniMap();
