import type { User } from "../../types/types";
import GenericPanel from "../../ui/pannel";
import { buildDungeonSave } from "./savedungeon";
import { getSession } from "../../utils/session";
import { createConnection, startConnection, onRoomMoved, onChatMessage } from "../../utils/signalrClient";
import { enableDrag, setSendDungeonEvent, loadItemsFromStorage, spawnDefaultRoom } from "./positioning";
import { state } from "./state";
import "./movement";

type MenuCategory = "rooms" | "enemies" | "traps";
let isRemoteUpdate = false;

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
  function throttle(fn: Function, delay: number) {
    let last = 0;
    return (...args: any[]) => {
      const now = Date.now();
      if (now - last > delay) {
        last = now;
        fn(...args);
      }
    };
  }

  function currentUser(): User {
    const session = getSession();
    if (!session || !session.user || !session.token) {
      window.location.href = "login.html";
      throw new Error("Sessione non valida");
    }
    return session.user;
  }

  async function sendDungeonEvent(type: string, payload: any) {
    await fetch("http://localhost:7071/api/dungeon_event", {
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
    const response = await fetch("http://localhost:7071/api/create_lobby", {
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
    
    onRoomMoved((data) => {
      if (data.movedBy === currentUser().uid) return;

      let el = document.querySelector(
        `[data-id="${data.roomId}"]`
      ) as HTMLElement;
      if (!el) {
        const newItem = data.fullItem ?? {
          id: data.roomId,
          src: data.src ?? "public/assets/rooms/sacrificeroom.png",
          type: data.type,
          x: data.x,
          y: data.y,
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
      }
      appendRoomToCanvas(el)
      isRemoteUpdate = false;
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

  function observeCanvasChanges() {
    const canvas = document.getElementById("infinite-canvas");
    if (!canvas) return;

    const sendMoveThrottled = throttle((id: string, x: number, y: number) => {
      const item = state.items.find(i => i.id === id);
      sendDungeonEvent("MOVE_ROOM", { roomId: id, x, y, src: item?.src, type: item?.type });
    }, 50);

    const observer = new MutationObserver((mutations) => {
      if (isRemoteUpdate) return;

      for (const mutation of mutations) {
        if (
          mutation.type === "attributes" &&
          mutation.attributeName === "style"
        ) {
          const target = mutation.target as HTMLElement;
          if (!target.dataset.id) continue;

          const x = parseInt(target.style.left || "0");
          const y = parseInt(target.style.top || "0");

          sendMoveThrottled(target.dataset.id, x, y);
        }
      }
    });

    observer.observe(canvas, {
      subtree: true,
      attributes: true,
      attributeFilter: ["style"]
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
    const itemsData: Record<MenuCategory, string[]> = {
      rooms: [
        "public/assets/rooms/sacrificeroom.png",
        "public/assets/rooms/portal_room.png",
        "public/assets/rooms/catacomb_room.png"
      ],
      enemies: ["public/assets/enemis/EvilMage.png"],
      traps: [
        "public/assets/traps/spike.png",
        "public/assets/traps/fire.png",
        "public/assets/traps/bearTrap.png"
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

            await fetch("http://localhost:7071/api/invite_dungeon", {
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
    const joinResponse = await fetch("http://localhost:7071/api/join_lobby", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        dungeonCode,
        userId: currentUser().uid
      })
    });

    const lobbyData = await joinResponse.json();

    await registerRealtimeListeners();

    if (lobbyData.state && lobbyData.state.item && lobbyData.state.items.length > 0){
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
    observeCanvasChanges();
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

    back.addEventListener("click", () => window.location.href = "homepage.html");

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
    });
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