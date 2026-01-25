import { buildDungeonSave } from "./savedungeon";
type MenuCategory = "rooms" | "enemies" | "traps";

const menuButtons = document.querySelectorAll<HTMLButtonElement>(".menu-btn");
const itemsContainer = document.getElementById("itemsContainer") as HTMLDivElement;

const itemsData: Record<MenuCategory, string[]> = {
  rooms: [
    "public/assets/rooms/sacrificeroom.png",
    "public/assets/rooms/portal_room.png",
    "public/assets/rooms/catacomb_room.png"
  ],
  enemies: [
    "public/assets/enemis/EvilMage.png"
  ],
  traps: [
    "public/assets/traps/spike.png",
    "public/assets/traps/fire.png",
    "public/assets/traps/bearTrap.png"
  ]
};
function renderItems(category: MenuCategory): void {
  itemsContainer.innerHTML = "";

  itemsData[category].forEach(src => {
    const card = document.createElement("div");
    card.className =
      "w-24 h-32 bg-slate-800/80 rounded-lg border border-white/10 " +
      "flex flex-col items-center justify-center cursor-pointer relative overflow-hidden shadow-xl";
    const img = document.createElement("img");
    img.src = src;
    img.className = "w-16 h-16 object-contain menu-item";
    img.draggable = true;

    const fileName = src.split("/").pop() || "Unknown";
    const nameWithoutExt = fileName.split(".")[0];
    const labelText = nameWithoutExt.replace(/[-_]/g, " ");
    const label = document.createElement("span");
    label.className = "text-xs text-white mt-1 text-center";
    label.id = "itemName";
    label.textContent = labelText.charAt(0).toUpperCase() + labelText.slice(1);

    card.appendChild(img);
    card.appendChild(label);
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