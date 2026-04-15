import "./movement";
import { state } from "./state";
import GenericPanel from "../../ui/pannel";
import type { User } from "../../types/types";
import { buildDungeonSave } from "./savedungeon";
import { getSession } from "../../utils/session";
import { enableDrag, setSendDungeonEvent, setSendRealTimeEvent, loadItemsFromStorage, spawnDefaultRoom } from "./positioning";
import { createConnection, startConnection, onRoomMoved, onChatMessage, broadcastRealTimeMove, onNameChanged, onDungeonSaved } from "../../utils/signalrClient";

type MenuCategory = "rooms" | "enemies" | "traps";
export let isRemoteUpdate = false;
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export function initDungeonEditor() {
  const menuButtons = document.querySelectorAll<HTMLButtonElement>(".menu-btn");
  const itemsContainer = document.getElementById("itemsContainer") as HTMLDivElement;
  const codeDungeon = document.getElementById("code-label") as HTMLParagraphElement;
  const save = document.getElementById("save") as HTMLParagraphElement;
  const nameInput = document.getElementById("dungeon-name-input") as HTMLInputElement;
  const back = document.getElementById("back-arrow") as HTMLParagraphElement;
  const inviteLabel = document.getElementById("sent-label") as HTMLParagraphElement;

  let dungeonCode = localStorage.getItem("dungeonCode");
  if (!dungeonCode) {
    console.log("Sono HOST")
    const gameName = "Stormbyte";
    const prefix = gameName.slice(0, 3).toUpperCase();
    const randomNumber = Math.floor(1000 + Math.random() * 9000);
    dungeonCode = `${prefix}-${randomNumber}`;
    localStorage.setItem("dungeonCode", dungeonCode);
  }
  codeDungeon.textContent = `Codice: ${dungeonCode}`;

  let invitedFriends: string[] = [];
  const MAX_INVITES = 5;

  setSendDungeonEvent(sendDungeonEvent);
  setSendRealTimeEvent((payload) =>{
    broadcastRealTimeMove(dungeonCode, {
      ...payload,
      movedBy: currentUser().uid
    });
  });

  function currentUser(): User {
    const session = getSession();
    if (!session || !session.user || !session.token) {
      window.location.href = "login.html";
      throw new Error("Sessione non valida");
    }
    return session.user;
  }

  async function sendDungeonEvent(type: string, payload: any) {
    await fetch(`${API_BASE_URL}/dungeon_event`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        dungeonCode,
        userId: currentUser().uid,
        type,
        payload
      })
    });
  }
  async function createLobbyOnServer() {
    const session = getSession();
    if (!session) return;
    const response = await fetch(`${API_BASE_URL}/create_lobby`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.token}`
      },
      body: JSON.stringify({
        dungeonCode,
        userId: session.user.uid
      })
    });
    const data = await response.json();
    if (!response.ok) alert(data.error);
  }
  

  async function registerRealtimeListeners() {
    const user = currentUser();
    createConnection(user);
    await startConnection();

    onDungeonSaved(() => {
      showCompletionPanel();
    });

    onNameChanged((payload) => {
      const nameInput = document.getElementById("dungeon-name-input") as HTMLInputElement;
      if (nameInput && nameInput.value !== payload.name){
        nameInput.value = payload.name;
      }
    });
    onRoomMoved((data) => {
      if (data.movedBy === currentUser().uid) return;

      let el = document.querySelector(
        `[data-id="${data.roomId}"]`
      ) as HTMLElement;
      if (!el) {
        const AZURE_BASE_URL = "https://stormbyte.blob.core.windows.net/stormbyte-assets/";

        const newItem = data.fullItem ?? {
          id: data.roomId,
          src: data.src ?? AZURE_BASE_URL + "rooms/sacrificeroom.png",
          type: data.type,
          x: data.x,
          y: data.y,  
          width: data.width,
          height: data.height
        };

        appendRoomToCanvas(newItem);

        el = document.querySelector(
          `[data-id="${data.roomId}"]`
        ) as HTMLElement;
        
        if (!el) return;
      }

      isRemoteUpdate = true;

      el.style.left = `${data.x}px`;
      el.style.top = `${data.y}px`;

      const item = state.items.find(i => i.id === data.roomId);
      if (item) {
        item.x = data.x;
        item.y = data.y;

        el.style.left = `${data.x}px`;
        el.style.top = `${data.y}px`;
      }
      appendRoomToCanvas(el)
      setTimeout(() => {
        isRemoteUpdate = false;
      }, 0);
    });

    onChatMessage((data) => {
      const messagesContainer = document.getElementById("messages") as HTMLDivElement;
      if (!messagesContainer) return;

      const msgElement = document.createElement("p");
      const sender = data.username || "Sconosciuto";
      const text = data.text || "";

      msgElement.innerHTML = `<strong>${sender}:</strong> ${text}`;
      messagesContainer.appendChild(msgElement);

      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    });
  }

  function appendRoomToCanvas(item: any) {
    const canvas = document.getElementById("infinite-canvas") as HTMLDivElement;
    if (!canvas) return;

    const existing = document.querySelector(`[data-id="${item.id}"]`);
    if (existing) return;

    const img = document.createElement("img");
    img.src = item.src;
    img.classList.add("absolute", "select-none", `${item.type}-dynamic`);
    img.style.width = `${item.width}px`;
    img.style.height = `${item.height}px`;
    img.style.left = `${item.x}px`;
    img.style.top = `${item.y}px`;
    img.dataset.id = item.id;

    canvas.appendChild(img);
    enableDrag(img, item);
    state.items.push(item);
  }

  function renderItems(category: MenuCategory): void {
    const AZURE_BASE_URL = "https://stormbyte.blob.core.windows.net/stormbyte-assets/";
    const itemsData: Record<MenuCategory, string[]> = {
      rooms: [
        AZURE_BASE_URL + "rooms/sacrificeroom.png",
        AZURE_BASE_URL + "rooms/portal_room.png",
        AZURE_BASE_URL + "rooms/catacomb_room.png"
      ],
      enemies: [AZURE_BASE_URL + "enemis/EvilMage.png"],
      traps: [
        AZURE_BASE_URL + "traps/spike.png",
        AZURE_BASE_URL + "traps/fire.png",
        AZURE_BASE_URL + "traps/bearTrap.png"
      ]
    };

    itemsContainer.innerHTML = "";
    itemsData[category].forEach(src => {
      const card = document.createElement("div");
      card.className =
        "w-24 h-32 bg-slate-800/80 rounded-lg border border-white/10 flex flex-col items-center justify-center cursor-pointer relative overflow-hidden shadow-xl";

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

  function setupInvitePanel() {
    if (!inviteLabel) return;
    const panel = new GenericPanel("panel", "panel-content", "panel-overlay");

    inviteLabel.addEventListener("click", () => {
      const friendsList = currentUser().friends;
      const friendsHTML = friendsList.map(friend => `
        <div class="friend-row flex items-center justify-between border rounded-lg p-3">
          <div class="flex items-center">
            <img src="${friend.profImg}" alt="Avatar" class="w-12 h-12 rounded-full object-cover mr-4"/>
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
        button.addEventListener("click", async () => {
          const friend = friendsList[i];
          if (invitedFriends.includes(friend.uid)) return;
          if (invitedFriends.length >= MAX_INVITES) {
            return;
          }
          invitedFriends.push(friend.uid);
          button.textContent = "✓";
          button.disabled = true;

          try {
            const session = getSession();
            if (!session) throw new Error("Sessione non valida");

            await fetch(`${API_BASE_URL}/invite_dungeon`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${session.token}`
              },
              body: JSON.stringify({
                toUserId: friend.uid,
                fromUserId: session.user.uid,
                fromUsername: session.user.username,
                dungeonCode,
                dungeonName: nameInput.value.trim()
              })
            });
          } catch (err) {
            console.error("Errore invio invito dungeon:", err);
          }
        });
      });

      document.getElementById("closeInvite")!.addEventListener("click", () => panel.hide());
    });
  }

  window.addEventListener("DOMContentLoaded", async () => {
    await createLobbyOnServer();
    const joinResponse = await fetch(`${API_BASE_URL}/join_lobby`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        dungeonCode,
        userId: currentUser().uid
      })
    });

    const lobbyData = await joinResponse.json();
    const isOwner = lobbyData.ownerId === currentUser().uid;

    if (!isOwner) {
      if (save) save.style.display = "none";
      if (inviteLabel) inviteLabel.style.display = "none";

      if (nameInput) {
        nameInput.disabled = true;
        nameInput.classList.add("opacity-50", "cursor-not-allowed");
      }
    } else {
      nameInput.addEventListener("input", (e) => {
        const newName = (e.target as HTMLInputElement).value;
        sendDungeonEvent("NAME_CHANGED", { name: newName });
      });

      if (save) {
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

          buildDungeonSave(currentUser().uid, invitedFriends);

          sendDungeonEvent("DUNGEON_SAVED", {});
          showCompletionPanel();
        });
      }
    }

    await registerRealtimeListeners();

    if (lobbyData.state && lobbyData.state.item && lobbyData.state.items.length > 0) {
      const canvas = document.getElementById("infinite-canvas");
      if (canvas) canvas.innerHTML = "";
      state.items = [];

      lobbyData.state.items.forEach((item: any) => {
        appendRoomToCanvas(item);
      });
    } else {
      const savedItems = loadItemsFromStorage();
      if (savedItems.length === 0) {
        spawnDefaultRoom()
      } else {
        const canvas = document.getElementById("infinite-canvas");
        if (canvas) canvas.innerHTML = "";
        state.items = [];

        savedItems.forEach((item: any) => {
          appendRoomToCanvas(item)
        });
      }
    }

    if (lobbyData.state && lobbyData.state.messages) {
      const messagesContainer = document.getElementById("messages");
      lobbyData.state.messages.forEach((msg: any) => {
        const msgElement = document.createElement("p")
        msgElement.innerHTML = `<strong>${msg.username}:</strong> ${msg.text}`
        messagesContainer?.appendChild(msgElement)
      });
      if (messagesContainer) messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    setupInvitePanel();
    setupChat();
    renderItems("rooms");

    menuButtons.forEach(button => {
      button.addEventListener("click", () => {
        menuButtons.forEach(b => b.classList.remove("active"));
        button.classList.add("active");
        renderItems(button.id as MenuCategory);
      });
    });

    if (back) back.addEventListener("click", () => window.location.href = "homepage.html");
  });

  function setupChat() {
    const messageInput = document.getElementById("message") as HTMLInputElement;
    const sendBtn = document.getElementById("send-btn") as HTMLButtonElement;
    const messagesContainer = document.getElementById("messages") as HTMLDivElement;

    messagesContainer.innerHTML = "";

    const sendMessage = () => {
      const text = messageInput.value.trim();
      if (!text) return;

      const user = currentUser();

      sendDungeonEvent("CHAT_MESSAGE", {
        username: user.username,
        text: text
      });

      messageInput.value = ""
    };

    sendBtn.addEventListener("click", sendMessage);
    messageInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") sendMessage()
    })
  }
}

// Spostata fuori affinché sia accessibile ovunque
function showCompletionPanel() {
  if (document.getElementById("completion-panel")) return;

  const panel = document.createElement("div");
  panel.id = "completion-panel";
  panel.className = "fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4 backdrop-blur-sm";

  panel.innerHTML = `
      <div class="relative bg-gradient-to-b from-gray-800 to-gray-900 border-4 border-yellow-400 p-8 rounded-lg text-center max-w-md w-full shadow-[0_0_30px_rgba(250,204,21,0.3)]" style="font-family: 'Press Start 2P', cursive;">
        <div class="absolute inset-2 border-2 border-dashed border-gray-600 opacity-30 pointer-events-none"></div>
        <h2 class="relative text-green-400 text-[24px] mb-6 leading-relaxed drop-shadow-[0_0_10px_rgba(74,222,128,0.8)] animate-pulse z-10">
            SUCCESS!
        </h2>
        <p class="relative text-gray-100 text-[14px] mb-10 leading-loose drop-shadow-md z-10">
            Dungeon successfully saved and synchronized.
        </p>
        <button id="return-home-btn" class="relative z-10 w-full py-4 bg-blue-600 hover:bg-blue-500 text-white text-[16px] rounded transition-all duration-150 shadow-[0_6px_0_rgb(30,58,138)] hover:shadow-[0_3px_0_rgb(30,58,138)] hover:translate-y-[3px] active:shadow-[0_0px_0_rgb(30,58,138)] active:translate-y-[6px]">
            RETURN HOME
        </button>
    </div>
  `;

  document.body.appendChild(panel);

  document.getElementById("return-home-btn")?.addEventListener("click", () => {
    window.location.href = "homepage.html";
  });
}