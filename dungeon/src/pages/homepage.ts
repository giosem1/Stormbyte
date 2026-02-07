import Phaser from "phaser";
import { Torch } from "../scenes/torch";
import GenericPanel from "../ui/pannel";
import { PREVIEW_TO_CLASS, type Friend, type PlayerClass, type User } from "../types/types";

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

const rawUser = localStorage.getItem("user");

if (!rawUser) {
  window.location.href = "login.html";
  throw new Error("User non autenticato");
}

let user: User = JSON.parse(rawUser);
const username = document.getElementById("username") as HTMLParagraphElement;
const uid = document.getElementById("usercode") as HTMLParagraphElement; 
username.textContent = user.username
uid.textContent = user.uid


const createD = document.getElementById("create") as HTMLParagraphElement;
const changeC = document.getElementById("change") as HTMLParagraphElement;
const friends = document.getElementById("friends") as HTMLParagraphElement;
const dungeons = document.getElementById("dungeon") as HTMLParagraphElement;
const searchF = document.getElementById("search") as HTMLParagraphElement;
const chanllengeD = document.getElementById("chanllenge") as HTMLParagraphElement;
const exitD = document.getElementById("exit") as HTMLParagraphElement;

createD.addEventListener("click", ()=>{
  localStorage.setItem("user", JSON.stringify(user));
  window.location.href = "createDungeon.html";
})

chanllengeD.addEventListener("click", ()=>{
  panel.show(`
    <h2 class="panel-title text-lg mb-6">Join Chamber</h2>

    <input id="roomCode" type="text" placeholder="ENTER CODE"/>

    <button id="confirmRoom" class="panel-btn"> CONFIRM </button>

    <button id="randomRoom" class="panel-btn"> RANDOM ROOM </button>
  `);

  document.getElementById("confirmRoom")?.addEventListener("click", async () => {
    const code = (document.getElementById("roomCode") as HTMLInputElement).value;
    const response = await fetch(
      "http://localhost:7071/api/checkdungeon?code="+code
    );

    const dungeon = await response.json();
    localStorage.setItem("user", JSON.stringify(user));
    localStorage.setItem("dungeon", JSON.stringify(dungeon));
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
  let selectedClass: PlayerClass

  bindings.forEach(([id, cfg]) => {
    const card = document.getElementById(id);
    if (!card) return;
    
    card.addEventListener("mouseenter", () => mountPreview(card, cfg));
    card.addEventListener("mouseleave", () => unmountPreview(card, cfg));
    card.addEventListener("click", () => {
      selectedClass = PREVIEW_TO_CLASS[cfg.id];
      document
        .querySelectorAll("[id^='Selected']")
        .forEach(el => {
          el.classList.remove("border-yellow-400", "border-red-500");
        });

      card.classList.add("border-yellow-400");
      });
  });
  document.getElementById("confirmClass")?.addEventListener("click", ()=>{
    if (!selectedClass) {
    document
      .querySelectorAll("[id^='Selected']")
      .forEach(el => el.classList.add("border-red-500"));
    return;
  }
    updateClass(selectedClass, user.uid)
    panel.hide()
  });
  document.getElementById("cancelClass")?.addEventListener("click", () => {
    bindings.forEach(([id, cfg]) => {
      const card = document.getElementById(id);
      if (card) unmountPreview(card, cfg);
    });
    panel.hide();
  });
});

async function updateClass(selectedClass: string, UserId: string){
  try {
    const res = await fetch(
      `http://localhost:7071/api/class`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ selectedClass, UserId })
      }
    );
    if (!res.ok) throw new Error();
    const updatedUser: User = await res.json();
    user = updatedUser
  } catch {
    alert("Errore invio richiesta");
  }
}

friends.addEventListener("click", ()=>{
  console.log(user.friends)
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
          </div>
      `).join("");

      panel.show(`
          <h2 class="panel-title text-lg mb-4 text-center text-white font-bold">Invite Friends</h2>
          <div id="invite-list" class="flex flex-col space-y-3 mt-4">
              ${friendsHTML}
          </div>
          <button id="closeInvite" class="panel-btn mt-4 w-full text-center text-white font-bold">CLOSE</button>
      `);
      document.getElementById("closeInvite")!.addEventListener("click", () => {
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

searchF.addEventListener("click", () => {

  if (searchF.querySelector(".search-wrapper")) {
    return;
  }

  searchF.style.display = "inline-flex";
  searchF.style.alignItems = "center";

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

  const doSearch = async () => {
    const prefix = "SRBU";
    const value = input.value.trim();

    try{
      const res = await fetch(
        'http://localhost:7071/api/search_friend?code='+prefix+value
      );
      if (!res.ok) {
      throw new Error("Amico non trovato");
    }

    const friend = await res.json();
    showFriendPanel(friend);

    } catch(err) {
    console.error(err);
    alert("Utente non trovato");
    }
    
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

  searchF.appendChild(wrapper);

  input.focus();
});

function showFriendPanel(friend: Friend) {
  panel.show(`
    <h2 class="panel-title text-lg mb-4">Friend Found</h2>

    <div class="flex items-center border rounded-lg p-3 gap-4">
      <img 
        src="/assets/user/placeholder.png" 
        alt="${friend.username}"
        class="w-14 h-14 rounded-full"
        draggable="false"
      />

      <div class="flex flex-col flex-1">
        <span class="text-white font-semibold text-lg">
          ${friend.username}
        </span>
        <span class="text-gray-400 text-sm">
          Code: ${friend.uid}
        </span>
      </div>

      <button 
        id="sendFriendRequest"
        class="panel-btn"
      >
        Invia amicizia
      </button>
    </div>

    <button id="closeFriendPanel" class="panel-btn mt-4">
      CLOSE
    </button>
  `);

  document
    .getElementById("closeFriendPanel")
    ?.addEventListener("click", () => panel.hide());

  document
    .getElementById("sendFriendRequest")
    ?.addEventListener("click", () => {
      sendFriendRequest(friend, user.uid);
    });
}

async function sendFriendRequest(friend: Friend, UserId: String) {
  try {
    const res = await fetch(
      `http://localhost:7071/api/send_request`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ friend, UserId })
      }
    );
    //TODO: user friends list update in realtime
    if (!res.ok) throw new Error();
    const updatedUser: User = await res.json();
    user = updatedUser
    panel.show(`
      <h2 class="panel-title text-lg mb-4">Success</h2>
      <p class="text-gray-400">Friend request sent</p>
      <button class="panel-btn mt-4" id="closeSuccess">CLOSE</button>
    `);

    document
      .getElementById("closeSuccess")
      ?.addEventListener("click", () => panel.hide());

  } catch {
    alert("Errore invio richiesta");
  }
}