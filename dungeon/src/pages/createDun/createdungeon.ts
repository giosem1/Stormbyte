import { buildDungeonSave } from "./savedungeon";
type MenuCategory = "rooms" | "enemies" | "traps";

const menuButtons = document.querySelectorAll<HTMLButtonElement>(".menu-btn");
const itemsContainer = document.getElementById("itemsContainer") as HTMLDivElement;

const itemsData: Record<MenuCategory, string[]> = {
  rooms: [
    "public/assets/rooms/loginroom.png",
    "public/assets/rooms/sacrificeroom.png"
  ],
  enemies: [
    "public/assets/enemis/LoadBEnemis.png"
  ],
  traps: [
    "public/trap1.png",
    "public/trap2.png"
  ]
};
function renderItems(category: MenuCategory): void {
  itemsContainer.innerHTML = "";

  itemsData[category].forEach(src => {
    const card = document.createElement("div");
    card.className =
      "w-24 h-24 bg-slate-800/80 rounded-lg border border-white/10 " +
      "flex items-center justify-center cursor-pointer relative overflow-hidden shadow-xl";

    const img = document.createElement("img");
    img.src = src;
    img.className = "w-16 h-16 object-contain menu-item";
    img.draggable = true;

    card.appendChild(img);
    itemsContainer.appendChild(card);
  });
}

menuButtons.forEach(button => {
  button.addEventListener("click", () => {

    menuButtons.forEach(b => b.classList.remove("active"));
    button.classList.add("active");

    renderItems(button.id as MenuCategory);
  });
});

renderItems("rooms");

const back = document.getElementById("back-arrow") as HTMLParagraphElement;
back.addEventListener("click", ()=>{
  window.location.href = "homepage.html"
})

function downloadJSON(data: object) {
  const blob = new Blob(
    [JSON.stringify(data, null, 2)],
    { type: "application/json" }
  );

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "dungeon.json";
  a.click();

  URL.revokeObjectURL(url);
}

const save = document.getElementById("save") as HTMLParagraphElement;
save.addEventListener("click", ()=>{
  const dungeon = buildDungeonSave();
  downloadJSON(dungeon);
})