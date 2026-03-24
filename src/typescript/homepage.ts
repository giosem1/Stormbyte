import Phaser from "phaser";
import { Torch } from "./scenes/torch";
import GenericPanel from "../ui/pannel";
import { clearSession, getSession, setSession } from "../utils/session";
import { createConnection, startConnection } from "../utils/signalrClient";
import { PREVIEW_TO_CLASS, type Friend, type PlayerClass, type User } from "../types/types";

import { PREVIEW_CONFIG, mountPreview, unmountPreview } from "./previewanimation"; 
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

//User
const session = getSession();
if (!session) {
    window.location.href = "login.html";
    throw new Error("User non autenticato");
}

const user = session.user;

const username = document.getElementById("username") as HTMLParagraphElement;
const uid = document.getElementById("usercode") as HTMLParagraphElement; 
username.textContent = user.username
uid.textContent = user.uid

function currentUser(): User {
  const session = getSession();
  if (!session || !session.user) {
    window.location.href = "login.html";
    throw new Error("User non autenticato");
  }
  return session.user;
}

let notifications: any[] = JSON.parse(localStorage.getItem("app_notifications") || "[]");
updateNotificationBadge();

window.addEventListener("pageshow", () => {
  notifications = JSON.parse(localStorage.getItem("app_notifications") || "[]");
  updateNotificationBadge();
});

window.addEventListener("notifications_updated", () => {
  notifications = JSON.parse(localStorage.getItem("app_notifications") || "[]");
  updateNotificationBadge();
});

window.addEventListener("storage", (e) => {
    if (e.key === "app_notifications") {
        notifications = JSON.parse(e.newValue || "[]");
        updateNotificationBadge();
    }
});

const connection = createConnection(user);
startConnection();
connection.on("UserUpdated", (updatedUser) => {
  const currentSession = getSession();
  if (!currentSession) return;

  setSession({
    ...currentSession,
    user: {
      ...currentSession.user,
      ...updatedUser
    }
  });

  refreshUI();
});
function refreshUI() {
  const currentUser = getSession()?.user;
  if (!currentUser) return;

  username.textContent = currentUser.username;
  uid.textContent = currentUser.uid;
}

type EventType = "friend_request" | "class_change" | "dungeon_joined";

const events: Record<EventType, Array<(payload: any) => void>> = {
    friend_request: [],
    class_change: [],
    dungeon_joined: []
};

export function on(event: EventType, callback: (payload: any) => void) {
    events[event].push(callback);
}

export function emit(event: EventType, payload: any) {
    events[event].forEach(cb => cb(payload));
}

// Notification
const notificationBell = Object.assign(document.createElement("img"), {
  src: "/assets/icons/bell.png",
  id: "notificationBell",
});
document.body.appendChild(notificationBell);

notificationBell.addEventListener("click", () => {
  if (notifications.length === 0) {
    panel.show(`
      <h2 class="panel-title text-lg mb-4">Notify</h2>
      <p class="text-gray-400">No notifications.</p>
      <button id="closeNotifications" class="panel-btn mt-4">CLOSE</button>
    `);

    document.getElementById("closeNotifications")
      ?.addEventListener("click", () => panel.hide());

    return;
  }

  const notificationsHTML = notifications.map((n, index) => {

    if (n.type === "friend_request") {
      return `
        <div class="flex flex-col border border-green-500/50 bg-green-900/20 rounded-lg p-4 mb-3 shadow-lg shadow-green-900/20 relative overflow-hidden">
          <div class="absolute left-0 top-0 bottom-0 w-1 bg-green-500"></div>
          
          <div class="flex items-center gap-3 mb-3">
            <div class="text-3xl">🤝</div>
            <span class="text-white text-sm leading-tight">
              <span class="text-green-400 font-bold text-base tracking-wide">
                ${n.fromUsername}
              </span><br/>
              ti ha inviato una richiesta di amicizia
            </span>
          </div>

          <div class="flex gap-3 mt-1">
            <button class="panel-btn accept w-full text-center font-bold !bg-green-600 hover:!bg-green-500 !border-transparent transition-colors" data-index="${index}">
              ACCETTA
            </button>
            <button class="panel-btn reject w-full text-center font-bold !bg-red-600 hover:!bg-red-500 !border-transparent transition-colors" data-index="${index}">
              RIFIUTA
            </button>
          </div>
        </div>
      `;
    }

    if (n.type === "dungeon_invite") {
      const dungeonNameText = n.dungeonName || "Avventura Epica";
      return `
        <div class="flex flex-col border border-purple-500/50 bg-purple-900/20 rounded-lg p-4 mb-3 shadow-lg shadow-purple-900/20 relative overflow-hidden">
          <div class="absolute left-0 top-0 bottom-0 w-1 bg-purple-500"></div>

          <div class="flex items-center gap-3 mb-3">
            <div class="text-3xl">⚔️</div>
            <span class="text-white text-sm leading-tight">
              <span class="text-purple-400 font-bold text-base tracking-wide">
                ${n.ownerUsername}
              </span><br/>
              ti ha invitato nel dungeon<br/>
              <span class="text-cyan-400 font-bold text-base">
                ${dungeonNameText}
              </span>
            </span>
          </div>

          <div class="flex gap-3 mt-1">
            <button class="panel-btn join w-full text-center font-bold !bg-purple-600 hover:!bg-purple-500 !border-transparent transition-colors shadow-[0_0_10px_rgba(168,85,247,0.5)]" data-index="${index}">
              PARTECIPA
            </button>
            <button class="panel-btn reject w-full text-center font-bold !bg-gray-600 hover:!bg-gray-500 !border-transparent transition-colors" data-index="${index}">
              IGNORA
            </button>
          </div>
        </div>
      `;
    }

    if (n.type === "game_invite") {
      const dungeonNameText = n.dungeonName || "Avventura Epica";
      return `
        <div class="flex flex-col border border-red-500/50 bg-red-900/20 rounded-lg p-4 mb-3 shadow-lg shadow-red-900/20 relative overflow-hidden">
          <div class="absolute left-0 top-0 bottom-0 w-1 bg-red-500"></div>

          <div class="flex items-center gap-3 mb-3">
            <div class="text-3xl">🎮</div>
            <span class="text-white text-sm leading-tight">
              <span class="text-red-400 font-bold text-base tracking-wide">
                ${n.ownerUsername}
              </span><br/>
              ti ha invitato a GIOCARE nel dungeon<br/>
              <span class="text-yellow-400 font-bold text-base">
                ${dungeonNameText}
              </span>
            </span>
          </div>

          <div class="flex gap-3 mt-1">
            <button class="panel-btn join w-full text-center font-bold !bg-red-600 hover:!bg-red-500 !border-transparent transition-colors shadow-[0_0_10px_rgba(239,68,68,0.5)]" data-index="${index}">
              GIOCA
            </button>
            <button class="panel-btn reject w-full text-center font-bold !bg-gray-600 hover:!bg-gray-500 !border-transparent transition-colors" data-index="${index}">
              IGNORA
            </button>
          </div>
        </div>
      `;
    }

    return "";
  }).join("");

  panel.show(`
    <h2 class="panel-title text-lg mb-4">Notifiche</h2>
    ${notificationsHTML}
    <button id="closeNotifications" class="panel-btn mt-4">CLOSE</button>
  `);

  document.getElementById("closeNotifications")
    ?.addEventListener("click", () => panel.hide());

  document.querySelectorAll(".accept").forEach(btn => {
    btn.addEventListener("click", async (e: any) => {
      const index = e.target.dataset.index;
      const notif = notifications[index];

      await acceptFriendRequest(notif.fromUid, user);

      notifications.splice(index, 1);
      saveAndRefreshNotifications();
      panel.hide();
    });
  });

  document.querySelectorAll(".join").forEach(btn => {
  btn.addEventListener("click", async (e: any) => {

    const index = e.target.dataset.index;
    const notif = notifications[index];

    try {
      const session = getSession();
      if (!session) throw new Error("Sessione non valida");

      if (notif.type === "dungeon_invite") {
          const res = await fetch("http://localhost:7071/api/join_lobby", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${session.token}`
            },
            body: JSON.stringify({
              dungeonCode: notif.dungeonCode,
              userId: session.user.uid
            })
          });
    
          const data = await res.json();
    
          if (!res.ok) {
            throw new Error(data.error);
          }
        
          localStorage.setItem("dungeonCode", notif.dungeonCode);
          localStorage.setItem("isGuest", "true");
          window.location.href = "createDungeon.html";
      } else if (notif.type === "game_invite") {
        const res = await fetch("http://localhost:7071/api/retrive_dungeon?code=" + notif.dungeonCode);
        const dungeonData = await res.json();

        localStorage.setItem("dungeon", JSON.stringify(dungeonData));
        localStorage.setItem("host_username", notif.ownerUsername);

        localStorage.setItem("current_game_dungeon", notif.dungeonCode);

        if (notif.lobbyId) {
          localStorage.setItem("current_game_dungeon", notif.lobbyId);
        }

        localStorage.setItem("is_game_guest", "true");
        window.location.href = "dungeonGame.html";
      }

      notifications.splice(index, 1);
      saveAndRefreshNotifications();
      panel.hide();


    } catch (err: any) {
      console.error(err);
      alert(err.message || "Non è stato possibile partecipare al dungeon");
    }
  });
});
  document.querySelectorAll(".reject").forEach(btn => {
    btn.addEventListener("click", (e: any) => {
      const index = e.target.dataset.index;
      notifications.splice(index, 1);
      saveAndRefreshNotifications();
      panel.hide();
    });
  });
});

const notificationBadge = Object.assign(document.createElement("span"), {id: "notificationBadge"});
notificationBadge.style.display = "flex";
notificationBadge.style.display = "none";

document.body.appendChild(notificationBadge);

function saveAndRefreshNotifications(){
  localStorage.setItem("app_notifications", JSON.stringify(notifications));
  updateNotificationBadge();
}

function updateNotificationBadge() {
  const badge = document.getElementById("notificationBadge");
  if (!badge) return;

  const count = notifications.length;

  if (count > 0) {
    badge.textContent = count > 99 ? "99+" : count.toString();
    badge.classList.remove("hidden");
    badge.classList.add("flex");


    badge.style.display = "flex";
  } else {
    badge.classList.add("hidden");
    badge.classList.remove("flex");
    badge.style.display = "none";
  }
}

// Menu
const createD = document.getElementById("create") as HTMLParagraphElement;
const changeC = document.getElementById("change") as HTMLParagraphElement;
const friends = document.getElementById("friends") as HTMLParagraphElement;
const dungeons = document.getElementById("dungeon") as HTMLParagraphElement;
const searchF = document.getElementById("search") as HTMLParagraphElement;
const chanllengeD = document.getElementById("chanllenge") as HTMLParagraphElement;
const exitD = document.getElementById("exit") as HTMLParagraphElement;

// Create Dungeon
createD.addEventListener("click", ()=>{
  localStorage.setItem("user", JSON.stringify(user));
  window.location.href = "createDungeon.html";
})


// Search Friend
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
  input.autocomplete ="off";

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
    showFriendPanel(friend, user);

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

function showFriendPanel(friend: Friend, user: User) {
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
      sendFriendRequest(friend, user);
    });
}

async function sendFriendRequest(friend: Friend, user: User) {
  try {
    const res = await fetch(
      "http://localhost:7071/api/send_request",
      {
        method: "POST", 
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toUserId: friend.uid,
          fromUserId: user.uid,
          fromUserName: user.username
        })
      }
    );

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`HTTP ${res.status}: ${text}`);
    }

    panel.show(`
      <h2 class="panel-title text-lg mb-4">Success</h2>
      <p class="text-gray-400">Friend request sent</p>
      <button class="panel-btn mt-4" id="closeSuccess">CLOSE</button>
    `);

    document.getElementById("closeSuccess")
      ?.addEventListener("click", () => panel.hide());

  } catch (err) {
    console.error("Errore invio richiesta:", err);
    alert("Errore invio richiesta");
  }
}
async function acceptFriendRequest(fromUid: string, user: User) {
  try {
    await fetch("http://localhost:7071/api/accept_request", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fromUid,
        userId: user.uid
      })
    });

  } catch {
    alert("Errore accettazione richiesta");
  }
}


// Chanllenge Dungeon
chanllengeD.addEventListener("click", ()=>{
  panel.show(`
    <h2 class="panel-title text-lg mb-6">Join Chamber</h2>

    <input id="roomCode" type="text" placeholder="ENTER CODE" autocomplete="off"/>

    <button id="confirmRoom" class="panel-btn"> CONFIRM </button>

    <button id="randomRoom" class="panel-btn"> RANDOM ROOM </button>
  `);

  document.getElementById("confirmRoom")?.addEventListener("click", async () => {
    const code = (document.getElementById("roomCode") as HTMLInputElement).value;
    const dungCode="STO-"+code
    const response = await fetch(
      "http://localhost:7071/api/retrive_dungeon?code="+dungCode
    );

    const dungeon = await response.json();
    const uniqueLobbyId = `${dungCode}_${session.user.username}`;

    localStorage.setItem("current_game_dungeon", dungCode);
    localStorage.setItem("current_lobby_id", uniqueLobbyId);
    localStorage.setItem("is_game_guest", "false");
    localStorage.setItem("user", JSON.stringify(user));
    localStorage.setItem("dungeon", JSON.stringify(dungeon));
    window.location.href = "dungeonGame.html";

  });

  document.getElementById("randomRoom")?.addEventListener("click", () => {
    window.location.href = "dungeonGame.html";
  });
})

// Change Class
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
  } catch {
    alert("Errore invio richiesta");
  }
}

// Friend List
friends.addEventListener("click", ()=>{
  const friendsList = currentUser().friends
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

// Dungeon List
dungeons.addEventListener("click", ()=>{
  const dungeonList = currentUser().dungeons
  const dungeonHTML = dungeonList?.map(dungeon => `
    <div class="flex items-center border rounded-lg p-3">
        <div class="flex flex-col">
          <span class="text-white font-semibold text-lg">
            ${dungeon.name}
          </span>
          <span class="text-gray-400 text-sm">
            Dungeon ID: ${dungeon.code}
          </span>
        </div>
      </div>
    `).join("");
  panel.show(`
    <h2 class="panel-title text-lg mb-4">My Dungeons</h2>

    <div class="flex flex-col space-y-3 mt-4">
      ${dungeonHTML}
    </div>

    <button id="closeDungeons" class="panel-btn mt-4">CLOSE</button>
  `);
  document.getElementById("closeDungeons")?.addEventListener("click", () => {
    panel.hide();
  });
});

exitD.addEventListener("click", ()=>{
    clearSession();
    window.location.href = "login.html";

});