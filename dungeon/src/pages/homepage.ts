import Phaser from "phaser";
import { Torch } from "../scenes/torch";
import GenericPanel from "../ui/pannel";
import { PREVIEW_CONFIG, mountPreview, unmountPreview } from "../pages/previewanimation";
const config = {
   type: Phaser.AUTO,
   width: window.innerWidth,
   height: window.innerHeight,
   transparent: true,
   scene: Torch,
 };

 new Phaser.Game(config);

const panel = new GenericPanel(
  "generic-panel",
  "panel-content",
  "overlay"
);

const createD = document.getElementById("create") as HTMLParagraphElement;
const changeC = document.getElementById("change") as HTMLParagraphElement;
const friends = document.getElementById("friends") as HTMLParagraphElement;
const dungeons = document.getElementById("dungeon") as HTMLParagraphElement;
const searchD = document.getElementById("search") as HTMLParagraphElement;
const chanllengeD = document.getElementById("chanllenge") as HTMLParagraphElement;
const exitD = document.getElementById("exit") as HTMLParagraphElement;

createD.addEventListener("click", ()=>{
  window.location.href = "createDungeon.html";
})

chanllengeD.addEventListener("click", ()=>{
  panel.show(`
    <h2 class="panel-title text-lg mb-6">Join Chamber</h2>

    <input id="roomCode" type="text" placeholder="ENTER CODE"/>

    <button id="confirmRoom" class="panel-btn"> CONFIRM </button>

    <button id="randomRoom" class="panel-btn"> RANDOM ROOM </button>
  `);

  document.getElementById("confirmRoom")?.addEventListener("click", () => {
    const code = (document.getElementById("roomCode") as HTMLInputElement).value;
    console.log("Room code:", code);
    window.location.href = "dungeonGame.html";

  });

  document.getElementById("randomRoom")?.addEventListener("click", () => {
    window.location.href = "dungeonGame.html";
  });
})

changeC.addEventListener("click", () => {
  panel.show(`
    <h2 class="panel-title text-lg mb-4">Select Class</h2>

    <div class="flex flex-wrap justify-center space-x-4 mt-6 mb-4"> 
      <div id="SelectedCavaliere" class="bg-transparent border rounded-lg p-2 mb-4 
        flex flex-col items-center justify-start 
        w-full sm:w-1/2 md:w-1/4 lg:w-1/4 max-w-[150px]">

        <img class="w-full h-auto max-h-[128px]"
             src="/assets/heroes/Cavaliere.png"
             alt="Cavaliere Blu"/>

        <span class="block font-semibold text-xl text-white mt-2">Knight</span>
      </div>

      <div id="SelectedMago" class="bg-transparent border rounded-lg p-2 mb-4 
        flex flex-col items-center justify-start 
        w-full sm:w-1/2 md:w-1/4 lg:w-1/4 max-w-[150px]">

        <img class="w-full h-auto max-h-[128px]"
             src="/assets/heroes/Mago.png"
             alt="Mago Rosso"/>

        <span class="block font-semibold text-xl text-white mt-2">Mage</span>
      </div>

      <div id="SelectedArciere" class="bg-transparent border rounded-lg p-2 mb-4 
        flex flex-col items-center justify-start 
        w-full sm:w-1/2 md:w-1/4 lg:w-1/4 max-w-[150px]">

        <img class="w-full h-auto max-h-[128px]"
             src="/assets/heroes/Aricere.png"
             alt="Arciere Verde"/>

        <span class="block font-semibold text-xl text-white mt-2">Arcer</span>
      </div>

    </div>

    <button id="confirmClass" class="panel-btn">CONFIRM</button>
    <button id="cancelClass" class="panel-btn">CANCEL</button>
  `);
  
  const bindings = [
    ["SelectedCavaliere", PREVIEW_CONFIG.knight],
    ["SelectedMago", PREVIEW_CONFIG.mage],
    ["SelectedArciere", PREVIEW_CONFIG.archer]
  ] as const;

  bindings.forEach(([id, cfg]) => {
    const card = document.getElementById(id);
    if (!card) return;

    card.addEventListener("mouseenter", () => mountPreview(card, cfg));
    card.addEventListener("mouseleave", () => unmountPreview(card, cfg));
  });

  document.getElementById("cancelClass")?.addEventListener("click", () => {
    bindings.forEach(([id, cfg]) => {
      const card = document.getElementById(id);
      if (card) unmountPreview(card, cfg);
    });
    panel.hide();
  });
});

friends.addEventListener("click", ()=>{
 panel.show(`
    <h2 class="panel-title text-lg mb-4">Friends</h2>

    <div class="flex flex-col space-y-3 mt-4">

      <div class="flex items-center border rounded-lg p-3">
        <img
          src="/assets/user/placeholder.png"
          alt="User avatar"
          class="w-12 h-12 rounded-full object-cover mr-4"
        />

        <div class="flex flex-col">
          <span class="text-white font-semibold text-lg">
            Luca Rossi
          </span>
          <span class="text-gray-400 text-sm">
            UID: 102938
          </span>
        </div>
      </div>

      <div class="flex items-center border rounded-lg p-3">
        <img
          src="/assets/user/placeholder.png"
          alt="User avatar"
          class="w-12 h-12 rounded-full object-cover mr-4"
        />

        <div class="flex flex-col">
          <span class="text-white font-semibold text-lg">
            Sara Bianchi
          </span>
          <span class="text-gray-400 text-sm">
            UID: 847362
          </span>
        </div>
      </div>

      <div class="flex items-center border rounded-lg p-3">
        <img
          src="/assets/user/placeholder.png"
          alt="User avatar"
          class="w-12 h-12 rounded-full object-cover mr-4"
        />

        <div class="flex flex-col">
          <span class="text-white font-semibold text-lg">
            Marco Verdi
          </span>
          <span class="text-gray-400 text-sm">
            UID: 554221
          </span>
        </div>
      </div>

    </div>

    <button id="closeFriends" class="panel-btn mt-4">CLOSE</button>
  `);
  document.getElementById("closeFriends")?.addEventListener("click", () => {
    panel.hide();
  });

});

dungeons.addEventListener("click", ()=>{
  panel.show(`
    <h2 class="panel-title text-lg mb-4">My Dungeons</h2>

    <div class="flex flex-col space-y-3 mt-4">

      <div class="flex items-center border rounded-lg p-3">
        <div class="flex flex-col">
          <span class="text-white font-semibold text-lg">
            Crypt of Shadows
          </span>
          <span class="text-gray-400 text-sm">
            Dungeon ID: DNG-001
          </span>
        </div>
      </div>

      <div class="flex items-center border rounded-lg p-3">
        <div class="flex flex-col">
          <span class="text-white font-semibold text-lg">
            Infernal Depths
          </span>
          <span class="text-gray-400 text-sm">
            Dungeon ID: DNG-014
          </span>
        </div>
      </div>

      <div class="flex items-center border rounded-lg p-3">
        <div class="flex flex-col">
          <span class="text-white font-semibold text-lg">
            Frost King Lair
          </span>
          <span class="text-gray-400 text-sm">
            Dungeon ID: DNG-221
          </span>
        </div>
      </div>

    </div>

    <button id="closeDungeons" class="panel-btn mt-4">CLOSE</button>
  `);
  document.getElementById("closeDungeons")?.addEventListener("click", () => {
    panel.hide();
  });
});

exitD.addEventListener("click", ()=>{
  window.location.href = "login.html";
})

searchD.addEventListener("click", () => {

  if (searchD.querySelector(".search-wrapper")) {
    return;
  }

  searchD.style.display = "inline-flex";
  searchD.style.alignItems = "center";

  const wrapper = document.createElement("div");
  wrapper.className = "search-wrapper small";

  const input = document.createElement("input");
  input.type = "text";
  input.placeholder = "Code";

  const icon = document.createElement("img");
  icon.className = "icon";
  icon.src = "../../public/assets/icons/search.png";
  icon.alt = "Cerca";
  icon.draggable = false;

  const doSearch = () => {
    const value = input.value.trim();
    if (!value) return;
    console.log("Ricerca dungeon:", value);
  };

  icon.addEventListener("click", doSearch);

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      doSearch();
    }
  });
  input.addEventListener("input", () => {
    input.value = input.value.replace(/\D/g, '');
  });

  wrapper.appendChild(input);
  wrapper.appendChild(icon);

  searchD.appendChild(wrapper);

  input.focus();
});
