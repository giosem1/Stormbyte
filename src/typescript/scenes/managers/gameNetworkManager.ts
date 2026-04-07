import Phaser from "phaser";
import GameScene from "../gamescene";
import { TRAP_CONFIG } from "../../../types/types";
import { createConnection, startConnection, onChatMessage } from "../../../utils/signalrClient";

export class NetworkManager {
    private scene: GameScene;

    constructor(scene: GameScene){
        this.scene = scene;
    }

    public async initNetwork() {
        const connection = createConnection(this.scene.user);
        try {
            await startConnection();      
            const rawDungeon = localStorage.getItem("dungeon");
            if (!rawDungeon){
                throw new Error("Dungeon not found");
            }

            this.scene.dungeon = JSON.parse(rawDungeon);
            this.scene.dungeonCode = this.scene.dungeon.code;

            this.scene.isGuest = localStorage.getItem("is_game_guest") === "true";
        
            if (this.scene.isGuest) {
                await fetch("http://localhost:7071/api/join_game", {
                method: "POST",
                headers: { "Content-Type": "application/json"},
                body: JSON.stringify({
                    dungeonCode: this.scene.dungeonCode,
                    userId: this.scene.user.uid,
                    username: this.scene.user.username,
                    class: this.scene.userClass,
                    lobbyId: this.scene.lobbyId
                })
                });
                localStorage.removeItem("is_game_guest");
                localStorage.removeItem("current_lobby_id");
            } else {
                await fetch("http://localhost:7071/api/create_lobby", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    dungeonCode: this.scene.dungeonCode,
                    userId: this.scene.user.uid,
                    lobbyId: this.scene.lobbyId
                })
                });
            }
            this.scene.stroyManager.logEvent("DUNGEON_ENTERED", "Crossed the threshold of the dungeon, ready to face their destiny.")
        
        }catch(err){
            console.error("Error during the connection: ", err)
        }

        connection.on("PlayerJoinedGame", async (playerData: any) => {
            if (playerData.uid !== this.scene.user.uid) {

                const startRoom = this.scene.dungeon.rooms.find((r: any) => r.asset.includes("loginroom"));
                const startX = startRoom ? startRoom.x + startRoom.width / 2 : 0;
                const startY = startRoom ? startRoom.y + startRoom.height / 2 : 0;

                this.spawnOtherPlayer(playerData, startX, startY);
                const remotePlayer = this.scene.otherPlayers.get(playerData.uid);

                if (remotePlayer && playerData.username) {
                    const label = this.scene.playerManager.createPlayerLabel(startX, startY, playerData.username);
                    remotePlayer.setData("label", label);
                }
                if (!this.scene.isGuest && this.scene.hero) {
                    try {
                        await fetch("http://localhost:7071/api/sync_player_move", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            dungeonCode: this.scene.dungeonCode,
                            lobbyId: this.scene.lobbyId,
                            data: {
                                userId: this.scene.user.uid,
                                username: this.scene.user.username,
                                x: this.scene.hero.x,
                                y: this.scene.hero.y,
                                anim: this.scene.hero.anims.currentAnim?.key || "",
                                flipX: this.scene.hero.flipX,
                                class: this.scene.userClass
                            }
                        })
                        });
                    } catch (err){
                        console.error(err)
                    }
                }
            }
        });

        connection.on("PlayerMoved", (data: any) => {
            if (data.userId === this.scene.user.uid) return;

            let otherHero = this.scene.otherPlayers.get(data.userId);
            
            if (otherHero && otherHero.getData("isDead")) return;

            if (!otherHero) {
                this.spawnOtherPlayer({ 
                uid: data.userId, 
                username: data.username,
                class: data.class || "Knight" 
                }, data.x, data.y);
                otherHero = this.scene.otherPlayers.get(data.userId)!;

                if (otherHero && data.username) {
                    const label = this.scene.playerManager.createPlayerLabel(data.x, data.y, data.username);
                    otherHero.setData("label", label);
                }
            }
            otherHero.x = data.x;
            otherHero.y = data.y;
            const otherSprite = otherHero.getData("sprite");

            if (!otherSprite) return;

            otherSprite.setFlipX(data.flipX)

            if (data.anim && data.anim !== ""){
                otherSprite.play(data.anim, true);
            } else {
                otherSprite.stop();

                const pClass = data.class || "Knight";
                let idleTexture = "KnightDeath";

                if (pClass.toLowerCase() === "mage" ) idleTexture = "MageDeath";
                if (pClass.toLowerCase() === "archer" ) idleTexture = "ArcherDeath";

                otherSprite.setTexture(idleTexture, 0);
            }
        });

        connection.on("PlayerLeftGame", (uid: string) => {
            const otherPlayer = this.scene.otherPlayers.get(uid);

            if (otherPlayer) {
                otherPlayer.destroy();
                this.scene.otherPlayers.delete(uid);
            }
        });

        connection.on("EnemyDamaged", (enemyId: string, senderId: string) => {
            if (senderId === this.scene.user.uid) return;

            const enemy = this.scene.enemies.find(e => e.getData("enemyId") === enemyId);
            if (enemy) {
                this.scene.playerManager.applyEnemyDamageVisual(enemy);
            }
        });

        connection.on("ItemCollected", (itemId: string, senderId: string, username: string) => {
            if (senderId === this.scene.user.uid) return;
            if (!this.scene.isGuest) {
                this.scene.stroyManager.logEvent("ITEM_COLLECTED", `Collected item ${itemId}`, username);
            }

            const itemToDestroy = this.scene.itemsInScene.find(i => i.getData("itemId") === itemId);
            if (itemToDestroy) {
                itemToDestroy.destroy();
                this.scene.itemsInScene = this.scene.itemsInScene.filter(i => i !== itemToDestroy);
                this.scene.uiManager.checkWinCondition();
            }
        });

        connection.on("PlayerDied", (classType: string, senderId: string) => {
            if (senderId === this.scene.user.uid) return;

            const deadPlayerContainer = this.scene.otherPlayers.get(senderId);
            if (deadPlayerContainer) {
                deadPlayerContainer.setData("isDead", true);
                if (deadPlayerContainer.body) {
                    (deadPlayerContainer.body as Phaser.Physics.Arcade.Body).setVelocity(0, 0);
                }
                const realSprite = deadPlayerContainer.getData("sprite");
                if (realSprite) {
                    realSprite.stop();
                    realSprite.play("death" + classType, true);
                }

            }
        });

        connection.on("TrapActivated", (trapId: string, senderId: string) => {
            if (senderId === this.scene.user.uid) return;

            const trap = this.scene.traps.find(t => t.getData("trapId") === trapId);
            if (trap && !trap.getData("activated")) {
                const name = trap.getData("trapName") as keyof typeof TRAP_CONFIG;
                const config = TRAP_CONFIG[name];

                trap.setData("activated", true);
                trap.play(config.anim);

                trap.once("animationcomplete", () => {
                    trap.setTexture(config.idle);
                    trap.setData("activated", false);
                });
            }
        });

        connection.on("EnemyStateChanged", (payload: string, senderId: string) => {
            if (senderId === this.scene.user.uid) return;

            const [enemyId, newState] = payload.split("::");
            const enemy = this.scene.enemies.find(e => e.getData("enemyId") === enemyId);

            if (enemy) {
                enemy.setData("state", newState);
                enemy.play(`enemy_${newState}`, true);
            }
        });

        connection.on("StoryGenerated", (_userId: string, text: string, blobUrl: string) => {
            if (this.scene.uiManager && this.scene.uiManager.finalizeGuestWin) {
                this.scene.uiManager.finalizeGuestWin(text, blobUrl);
            } else {
                const storyElement = document.querySelector(".bard-text");
                if (storyElement && text) {
                    storyElement.innerHTML = text.replace(/\n/g, "<br>");
                }
            }
        });

        this.setupChat()
    }
    
    public spawnOtherPlayer(playerData: any, startX: number, startY: number ){
        const pClass = playerData.class || "Knight";
        let spriteKey = "KnightDeath";

        if (pClass === "Mage") spriteKey = "MageDeath";
        else if (pClass === "Archer") spriteKey = "ArcherDeath";

        const otherSprite = this.scene.add.sprite(0, 0, spriteKey, 0);
        otherSprite.setOrigin(0.5, 1);

        const frame = this.scene.textures.get(spriteKey).get("0");
        
        if (frame) {
            otherSprite.setScale(this.scene.HERO_TARGET_HEIGHT / frame.height);
        }

        const playerContainer = this.scene.add.container(startX, startY, [otherSprite]);
        playerContainer.setDepth(10);

        playerContainer.setData("sprite", otherSprite);
        playerContainer.setData("class", pClass);

        this.scene.otherPlayers.set(playerData.uid, playerContainer as any);
    }

    public async broadcastMovement() {
        if (!this.scene.hero || !this.scene.user) return;

        const currentX = Math.round(this.scene.hero.x);
        const currentY = Math.round(this.scene.hero.y);
        const isPlaying = this.scene.hero.anims.isPlaying;
        const currentAnim = isPlaying ? (this.scene.hero.anims.currentAnim?.key || "") : "";
        const currentFlipX = this.scene.hero.flipX;

        if (this.scene.lastSyncData.x === currentX && this.scene.lastSyncData.y  === currentY && this.scene.lastSyncData.anim === currentAnim && this.scene.lastSyncData.flipX === currentFlipX) return;

        const now = Date.now();

        if(now - this.scene.lastSyncTime < 50) return;
        this.scene.lastSyncData = {x: currentX, y: currentY, anim: currentAnim, flipX: currentFlipX };
        try{

        await fetch("http://localhost:7071/api/sync_player_move", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                dungeonCode: this.scene.dungeonCode,
                lobbyId: this.scene.lobbyId,
                data: {
                        userId: this.scene.user.uid,
                        username: this.scene.user.username,
                        class: this.scene.userClass,
                        x: currentX,
                        y: currentY,
                        anim: currentAnim,
                        flipX: currentFlipX
                    }
                })
            });
        } catch (err){
            console.error(err);
        }
    }
    public broadcastEnemyState(enemyId: string, newState: string){
        fetch("http://localhost:7071/api/update_game_lobby", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                dungeonCode: this.scene.dungeonCode,
                lobbyId: this.scene.lobbyId,
                userId: this.scene.user.uid,
                actionType: "ENEMY_STATE_CHANGED",
                targetId: `${enemyId}::${newState}`
            })
        }).catch(err => console.error(err));
    }

    public setupChat(){
        const messageInput = document.getElementById("message") as HTMLInputElement;
        const sendBtn = document.getElementById("send-btn") as HTMLButtonElement;
        const messagesContainer = document.getElementById("messages") as HTMLDivElement;

        const chatBox = document.getElementById("chat-box") as HTMLDivElement;
        const chatToggleBtn = document.getElementById("chat-toggle-btn") as HTMLDivElement;
        const chatBadge = document.getElementById("chat-badge") as HTMLSpanElement;

        if (!messageInput || !sendBtn || !messagesContainer) return;

        messagesContainer.innerHTML = "";
        let unreadCount = 0;

        const sendMessage = () => {
            const text = messageInput.value.trim();
            if (!text) return;
            
            fetch("http://localhost:7071/api/update_game_lobby", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                dungeonCode: this.scene.dungeonCode,
                lobbyId: this.scene.lobbyId,
                userId: this.scene.user.uid,
                actionType: "CHAT_MESSAGE",
                targetId: "chat",
                username: this.scene.user.username,
                text: text
                })
            }).catch(err => console.error(err));
            
            messageInput.value = "";
            messageInput.blur();
        };
        
        sendBtn.addEventListener("click", sendMessage);
        
        chatToggleBtn.addEventListener("click", () => {
        chatBox.classList.toggle("hidden");

        if (!chatBox.classList.contains("hidden")) {
            messageInput.focus();

            unreadCount = 0;
            if(chatBadge) {
                chatBadge.classList.add("hidden");
                chatBadge.innerText = "0";
            }
        } else {
            messageInput.blur();
        }
        })
        messageInput.addEventListener("keydown", (e) => {
        e.stopPropagation();
        if (e.key === "Enter") {
            sendMessage();
        } else if (e.key === "Escape") {
            messageInput.blur();
            chatBox.classList.add("hidden");
        }
        });

        messageInput.addEventListener("keyup", (e) => e.stopPropagation());
        messageInput.addEventListener("keypress", (e) => e.stopPropagation());

        messageInput.addEventListener("focus", () => { 
            if (this.scene.input.keyboard) {
                this.scene.input.keyboard.resetKeys();
                this.scene.input.keyboard!.enabled = false;
                this.scene.input.keyboard.clearCaptures();
            }
        });
        messageInput.addEventListener("blur", () => { 
            if (this.scene.input.keyboard) {
                this.scene.input.keyboard.enabled = true; 

                this.scene.input.keyboard.addCapture('W,A,S,D,E,SPACE');
            }  
        });

        onChatMessage((data: any) => {
            const msgElement = document.createElement("p");
            const sender = data.username || "Unknow";
            const texMsg = data.text || "";
            
            msgElement.innerHTML = `<strong>${sender}:</strong> ${texMsg}`;

            msgElement.style.margin = "5px 0";
            messagesContainer.appendChild(msgElement);

            messagesContainer.scrollTop = messagesContainer.scrollHeight;
            
            if (chatBox.classList.contains("hidden") && sender !== this.scene.user.username) {
                unreadCount++;
                if (chatBadge) {
                    chatBadge.innerText = unreadCount > 99 ? "99+" : unreadCount.toString();
                    chatBadge.classList.remove("hidden");
                }
            }
        });

    }

    public broadcastStory(storyText: string, blobUrl: string){
        fetch("http://localhost:7071/api/update_game_lobby", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                dungeonCode: this.scene.dungeonCode,
                lobbyId: this.scene.lobbyId,
                userId: this.scene.user.uid,
                actionType: "STORY_GENERATED",
                targetId: "story",  
                text: storyText,
                blobUrl: blobUrl
            })
        }).catch(err => console.error("Error during the send of story: ", err));
    }

    public async saveProgress(collectedItems: string[], fullStory: string, blobUrl?: string) {
        try {
            const res = await fetch("http://localhost:7071/api/save_game_progress", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    dungeonCode: this.scene.dungeonCode,
                    dungeonName: this.scene.dungeon.name,
                    lobbyId: this.scene.lobbyId,
                    userId: this.scene.user.uid,
                    username: this.scene.user.username,
                    userClass: this.scene.userClass,
                    items: collectedItems,
                    story: fullStory,
                    blobUrl: blobUrl
                })
            });
            return await res.json();
        } catch(err) {
            console.error("Error while saving progress: ", err);
        } 
    }
}