const draggables: NodeListOf<HTMLElement> = document.querySelectorAll(".draggable");
const canvas: HTMLElement | null = document.getElementById("infinite-canvas");

if (!canvas) throw new Error("Canvas non trovato");

draggables.forEach(el => {
  el.addEventListener("mousedown", (e: MouseEvent) => dragStart(e, el));
});

function dragStart(e: MouseEvent, el: HTMLElement) {
  e.preventDefault();
  const rect = el.getBoundingClientRect();
  const canvasRect = canvas!.getBoundingClientRect();

  const offsetX = e.clientX - rect.left;
  const offsetY = e.clientY - rect.top;

  canvas!.appendChild(el);
  el.style.position = "absolute";
  el.style.zIndex = "1000";

   function moveAt(pageX: number, pageY: number) {
    const x = pageX - canvasRect.left + canvas!.scrollLeft - offsetX;
    const y = pageY - canvasRect.top + canvas!.scrollTop - offsetY;
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
  }

  moveAt(e.pageX, e.pageY);

  function onMouseMove(event: MouseEvent) {
    moveAt(event.pageX, event.pageY);
  }

  function onMouseUp() {
    document.removeEventListener("mousemove", onMouseMove);
    document.removeEventListener("mouseup", onMouseUp);
  }

  document.addEventListener("mousemove", onMouseMove);
  document.addEventListener("mouseup", onMouseUp);
}
