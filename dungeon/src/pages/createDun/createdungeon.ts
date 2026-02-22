import type { User } from "../../types/types";
import GenericPanel from "../../ui/pannel";
import { buildDungeonSave } from "./savedungeon";
type MenuCategory = "rooms" | "enemies" | "traps";

const menuButtons = document.querySelectorAll<HTMLButtonElement>(".menu-btn");
const itemsContainer = document.getElementById("itemsContainer") as HTMLDivElement;
const codeDungeon = document.getElementById("code-label") as HTMLParagraphElement;


const rawUser = localStorage.getItem("user")
if (!rawUser) {
  window.location.href = "login.html";
  throw new Error("User non autenticato");
}

const user: User = JSON.parse(rawUser)

window.addEventListener("DOMContentLoaded", () => {
  const panel = new GenericPanel("panel", "panel-content", "panel-overlay");
  const invite = document.getElementById("sent-label") as HTMLParagraphElement;

  invite.addEventListener("click", () => {
    const friendsList = user.friends

    const friendsHTML = friendsList.map(friend => `
      <div class="friend-row flex items-center justify-between border rounded-lg p-3">
        <div class="flex items-center">
          <img src="${friend.profileImage}" alt="Avatar" class="w-12 h-12 rounded-full object-cover mr-4"/>
          <div class="flex flex-col">
            <span class="text-white font-semibold text-lg">${friend.username}</span>
            <span class="text-gray-400 text-sm">UID: ${friend.uid}</span>
          </div>
        </div>
        <button class="invite-btn text-white px-3 py-1 rounded" style="background-color: #ffcc00;">+</button>
      </div>
    `).join("");

    panel.show(`
      <h2 class="panel-title text-lg mb-4 text-center text-white font-bold">Invite Friends</h2>
      <div id="invite-list" class="flex flex-col space-y-3 mt-4">
        ${friendsHTML}
      </div>
      <button id="closeInvite" class="panel-btn mt-4 w-full text-center text-white font-bold">CLOSE</button>
    `);

    document.querySelectorAll(".invite-btn").forEach((btn, i) => {
      const button = btn as HTMLButtonElement;
      button.addEventListener("click", () => {
        const friend = friendsList[i];
        console.log(`Invito inviato a: ${friend.username} (UID: ${friend.uid})`);
        button.textContent = "✓";
        button.disabled = true;
      });
    });

    document.getElementById("closeInvite")!.addEventListener("click", () => {
      panel.hide();
    });
  });
});



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


function generateDungeonCode(): string {
  const gameName = "Stormbyte"
  const prefix = gameName.slice(0, 3).toUpperCase()
  const randomNumber = Math.floor(1000 + Math.random() * 9000)
  return `${prefix}-${randomNumber}`
}

let dungeonCode = localStorage.getItem("dungeonCode")

if (!dungeonCode) {
  dungeonCode = generateDungeonCode()
  localStorage.setItem("dungeonCode", dungeonCode)
}

codeDungeon.textContent = `Codice: ${dungeonCode}`

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

}

const save = document.getElementById("save") as HTMLParagraphElement;
const nameInput = document.getElementById("dungeon-name-input") as HTMLInputElement;

save.addEventListener("click", () => {
  const existingError = document.getElementById("name-error");
  if (existingError) existingError.remove();

  if (!nameInput.value.trim()) {
    const error = document.createElement("p");
    error.id = "name-error";
    error.textContent = "Inserisci il nome del dungeon";
    error.style.color = "#ffd700";
    error.style.fontSize = "0.5rem";
    error.style.marginTop = "6px";

    nameInput.parentElement!.appendChild(error);
    return;
  }

  const dungeon = buildDungeonSave(user.uid);
  downloadJSON(dungeon);
  
});