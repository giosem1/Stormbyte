import Phaser from "phaser";
import GenericPanel from "../../ui/pannel";
import { getSession } from "../../utils/session";
import { createConnection, startConnection } from "../../utils/signalrClient";
import { ENEMY_CONFIG, TRAP_CONFIG, type Dungeon, type ItemType, type RoomSave, type User } from "../../types/types";
import { createArcherAnimations, createEnemyAnimations, createHeartAnimations, createKnightAnimations, createMageAnimations, trapAnimation } from "./animation";

const SCALE_RULES: Record<ItemType, number> = {
  room: 1.2,
  enemy: 1,
  trap: 1.5
};
const HERO_TARGET_HEIGHT = 120;

const WALL_THICKNESS = 40;
const DOOR_WIDTH = 80;
export default class GameScene extends Phaser.Scene {
  private user!: User;
  private userClass!: string;
  private dungeon!: Dungeon;
  private hero!: Phaser.GameObjects.Sprite;
  private traps: Phaser.GameObjects.Sprite[] = [];
  private enemies: Phaser.GameObjects.Sprite[] = [];
  private currentRoom!: RoomSave;
  private isTransitioningRoom = false;
  private inventoryPanel?: Phaser.GameObjects.Container;
  private isInventoryOpen: boolean = false;
  private inventorySlots: Phaser.GameObjects.Image[] = [];
  private itemsInScene: Phaser.GameObjects.Image[] = [];
  private isAttacking = false;
  private isDead = false;
  private otherPlayers: Map<string, Phaser.GameObjects.Sprite> = new Map();
  private dungeonCode!: string;
  private isGuest: boolean = false;
  private lastSyncData = { x: 0, y: 0, anim: "", flipX: false };
  private lastSyncTime = 0;
  private facingRight: boolean = true;
  private isGameWon = false;

  constructor() {
    super("GameScene");
  }
  
  init(){
    const session = getSession();
    if (!session || !session.user){
      window.location.href = "login.html";
      return;
    }

    this.user = session.user
    this.userClass = this.user.class || "Knight";
    this.dungeonCode = localStorage.getItem("current_game_dungeon") || "";

  }

  async preload() {
    // Object image & spritesheet
    this.load.image("bg-stone", "assets/dark_wall.png");
    this.load.image("bag", "assets/user/bags.png");
    const rawDungeon = localStorage.getItem("dungeon")

    if(!rawDungeon){
      window.location.href = "homepage.html";
      throw new Error("Dungeon not foung");
    }

    this.load.json("dungeon", rawDungeon);
    this.load.image("heart", "assets/heart.png"); 
    this.load.spritesheet("heart_loss", "assets/heart_loss.png", {
        frameWidth: 256,
        frameHeight: 217
    });

    console.log("Classe nel preload: ", this.userClass)
    // Hero spritesheet
    //Knight Spritesheet 
    this.load.spritesheet("kng", "assets/KnightAnimation/KnightWalk.png", {
        frameWidth: 290,
        frameHeight: 309
    });
    this.load.spritesheet("kngAttack", "assets/KnightAnimation/KnightAttack.png", {
        frameWidth: 439,
        frameHeight: 408
    });
    this.load.spritesheet("KnightDeath", "assets/KnightAnimation/KnightDeath.png", {
        frameWidth: 361,
        frameHeight: 288
    });
  
    //Mage Spritesheet
    this.load.spritesheet("mg", "assets/MageAnimation/MageWalk.png", {
        frameWidth: 126,
        frameHeight: 260
    });
    this.load.spritesheet("mgAttack", "assets/MageAnimation/MageAttack.png", {
        frameWidth: 383,
        frameHeight: 321
    });
    this.load.spritesheet("MageDeath", "assets/MageAnimation/MageDeath.png", {
        frameWidth: 404,
        frameHeight: 285
    });
    
    //Archer Spritesheet
    this.load.spritesheet("arc", "assets/ArcherAnimation/ArcherWalk.png", {
        frameWidth: 254,
        frameHeight: 264
    });
    this.load.spritesheet("arcAttack", "assets/ArcherAnimation/ArcherAttack.png", {
        frameWidth: 389,
        frameHeight: 378
    });
    this.load.spritesheet("ArcherDeath", "assets/ArcherAnimation/ArcherDeath.png", {
        frameWidth: 293,
        frameHeight: 284
    });
    

    // Traps spritesheet
    this.load.image("spk_idle", "assets/traps/spike.png");
    this.load.spritesheet("spk", "assets/TrapAnimation/Spike_Trap.png", {
      frameWidth: 32,
      frameHeight: 32
    });
    this.load.image("fir_idle", "assets/traps/fire.png");
    this.load.spritesheet("fir", "assets/TrapAnimation/Fire_Trap.png", {
        frameWidth: 32,
        frameHeight: 41
    });
    this.load.image("brt_idle", "assets/traps/bearTrap.png");
    this.load.spritesheet("brt", "assets/TrapAnimation/Bear_Trap.png", {
        frameWidth: 32,
        frameHeight: 32
    });

    // Enemis spritesheet
    this.load.spritesheet("enemy_idle", "assets/enemis/EvilMageIdle.png", {
        frameWidth: 85,
        frameHeight: 94
    });

    this.load.spritesheet("enemy_alert", "assets/enemis/EvilMageAlert.png", {
        frameWidth: 122,
        frameHeight: 110
    });

    this.load.spritesheet("enemy_attack", "assets/enemis/EvilMageAttack.png", {
        frameWidth: 87,
        frameHeight: 110
    });
  }

  async create() {
    const connection = createConnection(this.user);
    try {
      await startConnection();      
      const rawDungeon = localStorage.getItem("dungeon");
      if (!rawDungeon){
        throw new Error("Dungeon not found");
      }

      this.dungeon = JSON.parse(rawDungeon);
      this.dungeonCode = this.dungeon.code;

      this.isGuest = localStorage.getItem("is_game_guest") === "true";
  
      if (this.isGuest) {

        await fetch("http://localhost:7071/api/join_game", {
          method: "POST",
          headers: { "Content-Type": "application/json"},
          body: JSON.stringify({
            dungeonCode: this.dungeonCode,
            userId: this.user.uid,
            username: this.user.username,
            class: this.userClass
          })
        });
        localStorage.removeItem("is_game_guest");
        localStorage.removeItem("host_username");
      } else {
        await fetch("http://localhost:7071/api/create_lobby", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            dungeonCode: this.dungeonCode,
            userId: this.user.uid 
          })
        });
      }
      
    }catch(err){
      console.error("Error during the connection: ", err)
    }

    connection.on("PlayerJoinedGame", async (playerData: any) => {
      if (playerData.uid !== this.user.uid) {

        const startRoom = this.dungeon.rooms.find((r: any) => r.asset.includes("loginroom"));
        const startX = startRoom ? startRoom.x + startRoom.width / 2 : 0;
        const startY = startRoom ? startRoom.y + startRoom.height / 2 : 0;

        this.spawnOtherPlayer(playerData, startX, startY);

        if (!this.isGuest && this.hero) {
          try {
            await fetch("http://localhost:7071/api/sync_player_move", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                dungeonCode: this.dungeonCode,
                data: {
                  userId: this.user.uid,
                  x: this.hero.x,
                  y: this.hero.y,
                  anim: this.hero.anims.currentAnim?.key || "",
                  flipX: this.hero.flipX,
                  class: this.userClass
                }
              })
            });
          }catch (err){
            console.error(err)
          }
        }
      }
    });

    connection.on("PlayerMoved", (data: any) => {
      if (data.userId === this.user.uid) return;

      let otherHero = this.otherPlayers.get(data.userId);
      
      if (otherHero && otherHero.getData("isDead")) return;

      if (!otherHero) {
        this.spawnOtherPlayer({ 
          uid: data.userId, 
          username: data.username,
          class: data.class || "Knight" 
        }, data.x, data.y);
        otherHero = this.otherPlayers.get(data.userId)!;
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
      const otherPlayer = this.otherPlayers.get(uid);

      if (otherPlayer) {
        otherPlayer.destroy();
        this.otherPlayers.delete(uid);
      }
    });

    connection.on("EnemyDamaged", (enemyId: string, senderId: string) => {
      if (senderId === this.user.uid) return;

      const enemy = this.enemies.find(e => e.getData("enemyId") === enemyId);
      if (enemy) {
        this.applyEnemyDamageVisual(enemy);
      }
    });

    connection.on("ItemCollected", (itemId: string, senderId: string) => {
      if (senderId === this.user.uid) return;

      const itemToDestroy = this.itemsInScene.find(i => i.getData("itemId") === itemId);
      if (itemToDestroy) {
        itemToDestroy.destroy();
        this.itemsInScene = this.itemsInScene.filter(i => i !== itemToDestroy);
        this.checkWinCondition();
      }
    });

    connection.on("PlayerDied", (classType: string, senderId: string) => {
      if (senderId === this.user.uid) return;

      const deadPlayerContainer = this.otherPlayers.get(senderId);
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
      if (senderId === this.user.uid) return;

      const trap = this.traps.find(t => t.getData("trapId") === trapId);
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
      if (senderId === this.user.uid) return;

      const [enemyId, newState] = payload.split("::");
      const enemy = this.enemies.find(e => e.getData("enemyId") === enemyId);

      if (enemy) {
        enemy.setData("state", newState);
        enemy.play(`enemy_${newState}`, true);
      }
    });

    if (!this.anims.exists("walk")) {
      this.createAllAnimations();
    }
    
    const { width, height } = this.scale;
    const bg = this.add.tileSprite(0, 0, width, height, "bg-stone");

    bg.setOrigin(0);
    bg.setScrollFactor(0);
    bg.setDepth(-100);
    bg.setAlpha(0.25);

    const bagIcon = this.add.image(width - 50, 50, "bag");
    bagIcon.setScale(0.1)
    bagIcon.setScrollFactor(0);
    bagIcon.setDepth(100);
    bagIcon.setInteractive();
    bagIcon.on("pointerdown", () => {

      const panel = new GenericPanel("generic-panel", "panel-content", "overlay");

      const rows = 3;
      const cols = 3;
      const totalSlots = rows * cols;

      let slotsHTML = "";

      for (let i = 0; i < totalSlots; i++) {

        const slot = this.inventorySlots[i];
        const isFilled = slot && slot.getData("filled");
        const itemKey = isFilled ? slot.getData("itemKey") : null;

        slotsHTML += `
          <div class="inventory-slot">
            ${isFilled 
              ? `<img src="assets/items/${itemKey}.png" class="inventory-item" />`
              : ``}
          </div>
        `;
      }

      panel.show(`
        <h2 class="panel-title text-lg mb-4 text-center">Inventario</h2>
        
        <div class="inventory-grid">
          ${slotsHTML}
        </div>

        <div class="text-center mt-6">
          <button id="closeBag" class="panel-btn">Chiudi</button>
        </div>
      `);

      document
        .getElementById("closeBag")
        ?.addEventListener("click", () => panel.hide());

    });

    const exitButton = this.add.text(50, 50, "<-", { fontFamily: '"Press Start 2P"', fontSize: '30px', color: '#ffffff'});
    exitButton.setOrigin(0.5, 0.5);
    exitButton.setScrollFactor(0);
    exitButton.setDepth(100);
    exitButton.setInteractive();
    exitButton.on("pointerdown", () => {
      window.location.href = 'homepage.html';
    });
    exitButton.on("pointerover", () => {
      exitButton.setColor("#facc15");
      exitButton.setFontSize(40)
    });
    exitButton.on("pointerout", () => {
      exitButton.setColor("#ffffff");
      exitButton.setFontSize(30)
    });

    const inviteText = this.add.text(exitButton.x + 30, exitButton.y + 40, "Invite", {
      fontFamily: '"Press Start 2P"',
      fontSize: '20px',
      color: '#ffffff'
    });
    inviteText.setOrigin(0.5, 0.5);
    inviteText.setScrollFactor(0);
    inviteText.setDepth(100);
    inviteText.setInteractive();
    inviteText.on("pointerover", () => {
      inviteText.setColor("#facc15");
      inviteText.setFontSize(25)
    });
    inviteText.on("pointerout", () => {
      inviteText.setColor("#ffffff");
      inviteText.setFontSize(20)
    });
    inviteText.on("pointerdown", () => {
      const panel = new GenericPanel("generic-panel", "panel-content", "overlay");
      const friendsList = this.user.friends
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
      document.querySelectorAll(".invite-btn").forEach((btn, index) => {
          const button = btn as HTMLButtonElement;
          button.addEventListener("click", async () => {
              button.textContent = "✓";
              button.disabled = true;

              const friendToInvite = friendsList[index];

              try {
                await fetch("http://localhost:7071/api/invite_game", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    toUserid: friendToInvite.uid,
                    fromUserId: this.user.uid,
                    fromUsername: this.user.username,
                    dungeonCode: this.dungeonCode,
                    dungeonName: this.dungeon.name
                  })
                });
              }catch (err) {
                button.textContent = "+";
                button.disabled = false;
              }
          });
      });
      document.getElementById("closeInvite")!.addEventListener("click", () => {
          panel.hide();
      });
    });

    if (!this.dungeon) {
      throw new Error("Dungeon JSON non caricato");
    }

    this.dungeon.rooms.forEach(room => {
      this.load.image(room.id, room.asset);

      room.enemies.forEach(e =>
        this.load.image(e.id, e.asset)
      );

      room.traps.forEach(t =>
        this.load.image(t.id, t.asset)
      );
    });

    this.load.once("complete", () => {
      createEnemyAnimations(this.anims);
      trapAnimation(this.anims);
      this.buildDungeon();
      this.spawnHero();
      this.createUI();
      createHeartAnimations(this.anims);
      this.spawnRandomItems();
      this.initItemPickup();
    });
    this.load.on('loaderror', (file: any) => {
      console.error("Errore caricamento: ", file.key, file.src);
    });
    this.load.start();
  }
  update(): void {
    if (this.hero && !this.isDead) {
      this.broadcastMovement()
    }
  }
  private spawnOtherPlayer(playerData: any, startX: number, startY: number ){
    const pClass = playerData.class || "Knight";
    let spriteKey = "KnightDeath";

    if (pClass === "Mage") spriteKey = "MageDeath";
    else if (pClass === "Archer") spriteKey = "ArcherDeath";

    const otherSprite = this.add.sprite(0, 0, spriteKey, 0);
    otherSprite.setOrigin(0.5, 1);

    const frame = this.textures.get(spriteKey).get("0");
    
    if (frame) {
      otherSprite.setScale(HERO_TARGET_HEIGHT / frame.height);
    }

    const nameTag = this.add.text(0, -HERO_TARGET_HEIGHT - 10, playerData.username, {
      fontFamily: '"Press Start 2P"',
      fontSize: "12px",
      color: "#facc15",
      stroke: "#000000",
      strokeThickness: 3
    }).setOrigin(0.5);

    const playerContainer = this.add.container(startX, startY, [otherSprite, nameTag]);
    playerContainer.setDepth(10);

    playerContainer.setData("sprite", otherSprite);
    playerContainer.setData("class", pClass);

    this.otherPlayers.set(playerData.uid, playerContainer as any);
  }

  private async broadcastMovement() {
    if (!this.hero || !this.user) return;

    const currentX = Math.round(this.hero.x);
    const currentY = Math.round(this.hero.y);
    const isPlaying = this.hero.anims.isPlaying;
    const currentAnim = isPlaying ? (this.hero.anims.currentAnim?.key || "") : "";
    const currentFlipX = this.hero.flipX;

    if (this.lastSyncData.x === currentX && this.lastSyncData.y  === currentY && this.lastSyncData.anim === currentAnim && this.lastSyncData.flipX === currentFlipX) return;

    const now = Date.now();

    if(now - this.lastSyncTime < 50) return;
    this.lastSyncData = {x: currentX, y: currentY, anim: currentAnim, flipX: currentFlipX };
    try{

      await fetch("http://localhost:7071/api/sync_player_move", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dungeonCode: this.dungeonCode,
          data: {
            userId: this.user.uid,
            username: this.user.username,
            class: this.userClass,
            x: currentX,
            y: currentY,
            anim: currentAnim,
            flipX: currentFlipX
          }
        })
      })
    } catch (err){
      console.error(err);
    }
  }
  private createUI() {
    const { width, height } = this.scale;

    // Heart Container
    const maxHealth = 10;
    const heartSpacing = 4; 
    const heartSize = 32; 

    this.load.once("complete", () => {
        const healthContainer = this.add.container(width / 2, 50);
        healthContainer.setScrollFactor(0);
        healthContainer.setDepth(100);

        const hearts: Phaser.GameObjects.Image[] = [];

        for (let i = 0; i < maxHealth; i++) {
            const heart = this.add.image(-((maxHealth - 1) * (heartSize + heartSpacing)) / 2 + i * (heartSize + heartSpacing), 0, "heart");
            heart.setOrigin(0, 0);
            heart.setDisplaySize(heartSize, heartSize);
            healthContainer.add(heart);
            hearts.push(heart);
        }

        if (this.dungeon && this.dungeon.name) {
            const dungeonNameText = this.add.text(0, -heartSize, this.dungeon.name, {
                fontFamily: '"Press Start 2P"',
                fontSize: '20px',
                color: '#ffffff'
            }).setOrigin(0.40, 0);
            healthContainer.add(dungeonNameText);
        }

        this.data.set("hearts", hearts);
        this.data.set("maxHealth", maxHealth);
    });

    // Inventory Container
    const slotSize = 64;
    const padding = 10;

    this.inventoryPanel = this.add.container(width / 2, height / 2).setDepth(150);
    this.inventoryPanel.setScrollFactor(0);
    this.inventoryPanel.setVisible(false);

    this.inventorySlots = [];
    for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 3; col++) {
            const x = -slotSize - padding + col * (slotSize + padding);
            const y = -slotSize - padding + row * (slotSize + padding);

            const slotBg = this.add.rectangle(x, y, slotSize, slotSize, 0x7b5e57);
            slotBg.setStrokeStyle(2, 0x000000);
            this.inventoryPanel.add(slotBg);

            const slotItem = this.add.image(x, y, "");
            slotItem.setOrigin(0.5, 0.5);
            slotItem.setVisible(false);
            slotItem.setData("filled", false);
            this.inventoryPanel.add(slotItem);

            this.inventorySlots.push(slotItem);
        }
    }
    this.load.start();
  } 
  
  private buildDungeon() {
    this.dungeon.rooms.forEach(room => {
      const scale = SCALE_RULES.room;

      const roomImg = this.add.image(room.x, room.y, room.id);
      roomImg.setOrigin(0, 0);
      roomImg.setScale(scale);
      roomImg.setDepth(1);


      room.enemies.forEach((enemy, index) => {
        const e = this.add.sprite(room.x + enemy.x, room.y + enemy.y, "enemy_idle");

        const uniqueEnemyId = `${room.id}_enemy_${index}`;
        e.setData("enemyId", uniqueEnemyId);
        e.setOrigin(0, 0);
        e.setScale(scale);
        e.setDepth(3);

        e.setData("state", "idle");
        e.play("enemy_idle");

        this.enemies.push(e);
        e.setData("hp", 3);
        const hearts: Phaser.GameObjects.Image[] = [];

        for (let i = 0; i < 3; i++) {
          const h = this.add.image(e.x - 12 + i * 12, e.y - e.displayHeight - 10, "heart");
          h.setScale(0.5);
          h.setDepth(5);
          hearts.push(h);
        }

        e.setData("hearts", hearts);
      });

      room.traps.forEach((trap, index) => {
        const scale = SCALE_RULES.trap;
        const config = TRAP_CONFIG[trap.name];

        if (!config) return;

        const t = this.add.sprite(room.x + trap.x, room.y + trap.y, config.idle);
        t.setOrigin(0, 0);
        t.setScale(scale);
        t.setDepth(2);
        
        const uniqueTrapId = `${room.id}_trap_${index}`;
        t.setData("trapId", uniqueTrapId);

        t.setData("trapName", trap.name);
        t.setData("activated", false);

        this.traps.push(t);
      });
    });
  }

  // Spawn and collectiong items
  private spawnRandomItems() {
    const itemAssets = [
        { key: "potion", asset: "assets/items/potion.png" },
        { key: "emerald", asset: "assets/items/emerald.png" },
        { key: "rubin", asset: "assets/items/rubin.png" },
        { key: "sword", asset: "assets/items/sword.png" },
        { key: "shield", asset: "assets/items/shield.png" }
    ];
    
    itemAssets.forEach(item => {
        if (!this.textures.exists(item.key)) {
            this.load.image(item.key, item.asset);
        }
    });

    this.load.once("complete", () => {
      Phaser.Math.RND.sow([this.dungeonCode]);
        this.dungeon.rooms.forEach(room => {
            const numItems = Phaser.Math.RND.between(1, 3);

            for (let i = 0; i < numItems; i++) {
                const item = Phaser.Math.RND.pick(itemAssets);
                const centerX = room.x + room.width / 2;
                const centerY = room.y + room.height / 2;

                const rangeX = room.width / 4;
                const rangeY = room.height / 4;

                const x = Phaser.Math.RND.between(centerX - rangeX, centerX + rangeX);
                const y = Phaser.Math.RND.between(centerY - rangeY, centerY + rangeY);

                const obj = this.add.image(x, y, item.key);
                obj.setOrigin(0.5, 0.5);
                obj.setDepth(5);
                obj.setScale(2);

                const uniqueItemId = `${room.id}_item_${i}`;
                obj.setData("itemId", uniqueItemId);

                obj.setData("itemKey", item.key);
                obj.setData("roomId", room.id);

                this.itemsInScene.push(obj);
                obj.setInteractive({ useHandCursor: true });
                obj.on("pointerdown", () => {
                    this.collectItem(obj);
                });
            }
        });
    });

    this.load.start();
  }

  private initItemPickup() {
    const pickupKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.E);

    this.events.on("update", () => {
        if (Phaser.Input.Keyboard.JustDown(pickupKey)) {
            this.itemsInScene.forEach(item => {
                const dist = Phaser.Math.Distance.Between(this.hero.x, this.hero.y, item.x, item.y);

                if (dist < 50) {
                    this.collectItem(item);
                }
            });
        }
    });
  }

  private collectItem(item: Phaser.GameObjects.Image) {
    const slotIndex = this.inventorySlots.findIndex(s => !s.getData("filled"));
    if (slotIndex === -1) {
        return;
    }
    const itemId = item.getData("itemId");

    fetch("http://localhost:7071/api/update_game_lobby", {
      method:"POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        dungeonCode: this.dungeonCode,
        userId: this.user.uid,
        actionType: "ITEM_COLLECTED",
        targetId: itemId
      })
    }).catch(err => console.error(err));
    const slot = this.inventorySlots[slotIndex];
    slot.setTexture(item.getData("itemKey"));
    slot.setData("filled", true);
    slot.setData("itemKey", item.getData("itemKey"));

    if (this.isInventoryOpen) {
        slot.setVisible(true);
    }

    item.destroy();
    this.checkWinCondition()
    this.itemsInScene = this.itemsInScene.filter(i => i !== item);
  }

  // Room physic
  private getHeroHitbox(): Phaser.Geom.Rectangle {
    const width = 40;
    const height = 20;

    return new Phaser.Geom.Rectangle(
        this.hero.x - width / 2,
        this.hero.y - height,
        width,
        height
    );
  }

  private clampAndHandleRoomTransition(prevX: number, prevY: number) {
    if (!this.currentRoom || this.isTransitioningRoom) return;

    const r = this.currentRoom;
    const hitbox = this.getHeroHitbox();

    const roomRect = new Phaser.Geom.Rectangle(r.x, r.y, r.width * SCALE_RULES.room, r.height * SCALE_RULES.room);

    if (Phaser.Geom.Rectangle.ContainsRect(roomRect, hitbox)) {
        return;
    }
    const nextRoom = this.dungeon.rooms.find(other => {
        if (other.id === r.id) return false;

        const otherRect = new Phaser.Geom.Rectangle(
            other.x,
            other.y,
            other.width,
            other.height
        );

        return Phaser.Geom.Rectangle.Overlaps(hitbox, otherRect);
    });
    if (nextRoom) {
        this.isTransitioningRoom = true;
        this.currentRoom = nextRoom;

        this.hero.x = Phaser.Math.Clamp(
            this.hero.x,
            nextRoom.x + WALL_THICKNESS,
            nextRoom.x + (nextRoom.width * SCALE_RULES.room) - WALL_THICKNESS
        );
        this.hero.y = Phaser.Math.Clamp(
            this.hero.y,
            nextRoom.y + WALL_THICKNESS,
            nextRoom.y + (nextRoom.height * SCALE_RULES.room) - WALL_THICKNESS
        );

        this.time.delayedCall(0, () => {
            this.isTransitioningRoom = false;
        });

        return;
    }
    this.hero.x = prevX;
    this.hero.y = prevY;
  }

  // Animation
  private createAllAnimations() {
    createKnightAnimations(this.anims);
    createMageAnimations(this.anims);
    createArcherAnimations(this.anims);
    createEnemyAnimations(this.anims);
    trapAnimation(this.anims);
  }  

  // Traps
  private activeTraps() {
    const RANGE = 50;

    this.traps.forEach(trap => {
      if (trap.getData("activated")) return;

      const heroC = this.hero.getCenter();
      const trapC = trap.getCenter();

      const dist = Phaser.Math.Distance.Between(
        heroC.x,
        heroC.y,
        trapC.x,
        trapC.y
      );

      if (dist <= RANGE) {
        const name = trap.getData("trapName") as keyof typeof TRAP_CONFIG;
        const config = TRAP_CONFIG[name];
        if (!config) return;

        trap.setData("activated", true);
        
        trap.play(config.anim);
        fetch("http://localhost:7071/api/update_game_lobby", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            dungeonCode: this.dungeonCode,
            userId: this.user.uid,
            actionType: "TRAP_ACTIVATED",
            targetType: trap.getData("trapId")
          })
        }).catch(err => console.error(err));

        trap.once("animationcomplete", () => {
          trap.setTexture(config.idle);
          trap.setData("activated", false);
        });
        this.takeDamage(1)
      } 
    });
  }

  // Enemis
  private updateEnemies() {
    this.enemies.forEach(enemy => {
      const hearts = enemy.getData("hearts") as Phaser.GameObjects.Image[];
      if (hearts && hearts.length > 0) {
  
        const centerX = enemy.x + enemy.displayWidth / 2;
        const topY = enemy.y - 10;
  
        const totalWidth = (hearts.length - 1) * 12;
  
        hearts.forEach((h, i) => {
          h.setPosition(
            centerX - totalWidth / 2 + i * 12,
            topY
          );
        });
      }
      
      const enemyC = enemy.getCenter();
      const cfg = ENEMY_CONFIG.default;

      let minDist = Phaser.Math.Distance.Between(this.hero.x, this.hero.y, enemyC.x, enemyC.y);

      this.otherPlayers.forEach((otherHero) => {
        if (!otherHero.getData("isDead")) {
          const dist = Phaser.Math.Distance.Between(otherHero.x, otherHero.y, enemyC.x, enemyC.y);
          if (dist < minDist) {
            minDist = dist;
          }
        }
      });

      const state = enemy.getData("state");
      if (minDist <= cfg.alertRange && state === "idle") {
        enemy.setData("state", "alert");
        enemy.play("enemy_alert", true);
        
        this.broadcastEnemyState(enemy.getData("enemyId"), "alert");

        this.time.delayedCall(cfg.alertDuration, () => {
          if (enemy.getData("state") === "alert") {
            enemy.setData("state", "attack");
            enemy.play("enemy_attack", true);
            
            this.broadcastEnemyState(enemy.getData("enemyId"), "attack");

            this.time.delayedCall(500, () => {
              if (!this.isDead && Phaser.Math.Distance.Between(this.hero.x, this.hero.y, enemyC.x, enemyC.y) <= cfg.alertRange) {
                this.takeDamage(2);
              }
            });
          }
        });
      }

      if (minDist > cfg.alertRange && state !== "idle") {
        enemy.setData("state", "idle");
        enemy.play("enemy_idle", true);
        
        this.broadcastEnemyState(enemy.getData("enemyId"), "idle");
      }

      /* const heroC = this.hero.getCenter();
      const enemyC = enemy.getCenter();
  
      const dist = Phaser.Math.Distance.Between(
        heroC.x,
        heroC.y,
        enemyC.x,
        enemyC.y
      );
  
      const state = enemy.getData("state");
      const cfg = ENEMY_CONFIG.default;
  
      if (dist <= cfg.alertRange && state === "idle") {
        enemy.setData("state", "alert");
        enemy.play("enemy_alert", true);

        this.broadcastEnemyState(enemy.getData("enemyId"), "alert");
  
        this.time.delayedCall(cfg.alertDuration, () => {
          if (enemy.getData("state") === "alert") {
            enemy.setData("state", "attack");
            enemy.play("enemy_attack", true);
            
            this.broadcastEnemyState(enemy.getData("enemyId"), "attack");

            this.time.delayedCall(500, () => {
              if (!this.isDead) {
                this.takeDamage(2);
              }
            });
          }
        });
      }
  
      if (dist > cfg.alertRange && state !== "idle") {
        enemy.setData("state", "idle");
        enemy.play("enemy_idle", true);
      } */
    });
  }

  private broadcastEnemyState(enemyId: string, newState: string){
    fetch("http://localhost:7071/api/updated_game_lobby", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        dungeonCode: this.dungeonCode,
        userId: this.user.uid,
        actionType: "ENEMY_STATE_CHANGED",
        targetId: `${enemyId}::${newState}`
      })
    }).catch(err => console.error(err));
  }
  
  //Hero
  private getTextureKey(playerClass: string): string {
    switch (playerClass.toLowerCase()) {
      case "mage": return "mg";
      case "archer": return "arc";
      case "knight": 
      default: return "kng";
    }
  }

  private spawnHero() {
    const startRoom = this.dungeon.rooms.find(r =>
      r.asset.includes("loginroom")
    );

    if (!startRoom) {
      throw new Error("loginroom non trovata");
    }
    this.currentRoom = startRoom; 

    const x = startRoom.x + startRoom.width / 2;
    const y = startRoom.y + startRoom.height / 2;
    const textureKey = this.getTextureKey(this.userClass);
    this.hero = this.add.sprite(x, y, textureKey, 0);
    this.hero.setOrigin(0.5, 1);
    this.hero.setDepth(10);
    const frame = this.textures.get(this.userClass+"Death").get("0");
    const scale = HERO_TARGET_HEIGHT / frame.height;
    this.hero.setScale(scale);

    this.isDead = false;
    this.isAttacking = false;
    this.cameras.main.startFollow(this.hero);
    this.cameras.main.setZoom(1);
    createKnightAnimations(this.anims);
    this.initMovement();
    this.initAttack();
  }

  //Hero movement
  private initMovement() {
    const cursors = this.input.keyboard!.createCursorKeys();
    const speed = 200;

    const keys = this.input.keyboard!.addKeys({
        up: Phaser.Input.Keyboard.KeyCodes.W,
        down: Phaser.Input.Keyboard.KeyCodes.S,
        left: Phaser.Input.Keyboard.KeyCodes.A,
        right: Phaser.Input.Keyboard.KeyCodes.D
    }) as any;

    this.events.on("update", (_: any, delta: number) => {
      const prevX = this.hero.x;
      const prevY = this.hero.y;
      if (this.isAttacking || this.isDead || this.isGameWon){
        if (this.isGameWon && this.hero.active) this.hero.stop();
        return;
      } 
      const dt = delta / 1000;
      let moving = false;

      if (cursors.left?.isDown || keys.left?.isDown) {
          this.hero.x -= speed * dt;
          this.facingRight = false;
          this.hero.play("walk"+this.userClass, true);
          moving = true;
      } else if (cursors.right?.isDown || keys.right?.isDown) {
          this.hero.x += speed * dt;
          this.facingRight = true; 
          this.hero.play("walk"+this.userClass, true);
          moving = true;
      } else if (cursors.up?.isDown || keys.up?.isDown) {
          this.hero.y -= speed * dt;
          this.hero.play("walk"+this.userClass, true);
          moving = true;
      } else if (cursors.down?.isDown || keys.down?.isDown) {
          this.hero.y += speed * dt;
          this.hero.play("walk"+this.userClass, true);
          moving = true;
      }
        
      if (!moving && !this.isAttacking) {
        this.hero.stop();
        this.hero.setTexture(this.userClass+"Death", 0);
      }

      this.updateHeroFacing();

      if (this.hero && this.currentRoom && !this.isTransitioningRoom){
        const roomCenterX = this.currentRoom.x + (this.currentRoom.width * SCALE_RULES.room) / 2;
        const roomCenterY = this.currentRoom.y + (this.currentRoom.height * SCALE_RULES.room) / 2;

        const minX = this.currentRoom.x + WALL_THICKNESS;
        const maxX = this.currentRoom.x + (this.currentRoom.width * SCALE_RULES.room) - WALL_THICKNESS;
        const minY = this.currentRoom.y + WALL_THICKNESS;
        const maxY = this.currentRoom.y + (this.currentRoom.height * SCALE_RULES.room) - WALL_THICKNESS;

        const isAtHorizontalDoor = Math.abs(this.hero.y - roomCenterY) < (DOOR_WIDTH / 2);
        const isAtVerticalDoor = Math.abs(this.hero.x - roomCenterX) < (DOOR_WIDTH / 2);

        if (!isAtHorizontalDoor){
          if (this.hero.x < minX) this.hero.x = minX;
          if (this.hero.x > maxX) this.hero.x = maxX;
        }

        if (!isAtVerticalDoor) {
          if (this.hero.y < minY) this.hero.y = minY;
          if (this.hero.y > maxY) this.hero.y = maxY; 
        }
      }
      this.activeTraps();
      this.updateEnemies();
      this.clampAndHandleRoomTransition(prevX, prevY);
    });
  }

  //Hero attack
  private damageEnemy(enemy: Phaser.GameObjects.Sprite) {
    const enemyId = enemy.getData("enemyId");

    fetch("http://localhost:7071/api/update_game_lobby", {
      method:"POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        dungeonCode: this.dungeonCode,
        userId: this.user.uid,
        actionType: "ENEMY_DAMAGED",
        targetId: enemyId
      })
    }).catch(err => console.error(err));

    this.applyEnemyDamageVisual(enemy);
  }

  private applyEnemyDamageVisual(enemy: Phaser.GameObjects.Sprite) {
    let hp = enemy.getData("hp");
    if (hp <= 0) return;

    hp--;
    enemy.setData("hp", hp);
  
    const hearts = enemy.getData("hearts") as Phaser.GameObjects.Image[];
    if (hearts && hearts[hp]) {
        const heart = hearts[hp];
        this.time.delayedCall(1000, () => {
            heart.setVisible(false);
        });
    }
  
    if (hp === 0) {
      enemy.stop();
      if (hearts) {
          hearts.forEach((h, i) => {
              this.time.delayedCall(i * 900, () => h.destroy());
          });
      }
  
      enemy.destroy();
      this.enemies = this.enemies.filter(e => e !== enemy);
      
      this.checkWinCondition();
    }
  }

  private getAttackHitbox(): Phaser.Geom.Rectangle {
    if (!this.hero.frame) return new Phaser.Geom.Rectangle(this.hero.x, this.hero.y, 0, 0);

    const scale = this.hero.scale;
    const width = this.hero.frame.width * scale;
    const height = this.hero.frame.height * scale;
    const offsetX = this.hero.flipX ? -width * 0.5 : width * 0.5;
    const offsetY = -height * 0.5;

    return new Phaser.Geom.Rectangle(
        this.hero.x + offsetX - width / 2,
        this.hero.y + offsetY - height / 2,
        width,
        height
    );
}

  private initAttack() {
    const attackKey = this.input.keyboard!.addKey(
        Phaser.Input.Keyboard.KeyCodes.SPACE
    );

    attackKey.on("down", () => {
      if (this.isAttacking) return;
  
      this.isAttacking = true;
  
      this.hero.setFlipX(this.facingRight ? false : true);

      this.hero.play("attack"+this.userClass, true);
      this.updateHeroFacing();
      const attackHitbox = this.getAttackHitbox();
  
      this.enemies.forEach(enemy => {
          const enemyRect = enemy.getBounds();
  
          if (Phaser.Geom.Rectangle.Overlaps(attackHitbox, enemyRect)) {
              this.damageEnemy(enemy);
          }
      });
  });

    this.hero.on("animationcomplete", (anim: Phaser.Animations.Animation) => {
        if (anim.key === "attack"+this.userClass) {
            this.isAttacking = false;
            const correctDeathKey = this.userClass + "Death";
            this.updateHeroFacing();
            this.hero.setTexture(correctDeathKey, 0);
        }
    });
  }

  private updateHeroFacing() {
    if (!this.hero) return;

    const isMage = this.userClass.toLowerCase() === "mage";
    const isWalking = this.hero.anims.isPlaying && this.hero.anims.currentAnim?.key.includes("walk");
    
    if(isMage && !isWalking){
      if (this.facingRight) {
        this.hero.setFlipX(true);
      } else {
        this.hero.setFlipX(false);
      }
    } else {
      if (this.facingRight) {
        this.hero.setFlipX(false);
      } else {
        this.hero.setFlipX(true);
      }
    }

  }

  // Hero damege taken
  private takeDamage(amount: number) {
    const hearts = this.data.get("hearts") as Phaser.GameObjects.Image[];
    if (!hearts || amount <= 0) return;

    const visibleHearts = hearts
        .map((h, i) => h.visible ? i : -1)
        .filter(i => i !== -1);

    const damage = Math.min(amount, visibleHearts.length);

    for (let i = 0; i < damage; i++) {
        const index = visibleHearts[visibleHearts.length - 1 - i];
        const heart = hearts[index];

        heart.setVisible(false);
        const animHeart = this.add.sprite(
            heart.x + heart.parentContainer!.x,
            heart.y + heart.parentContainer!.y,
            "heart_loss"
        );

        animHeart.setScrollFactor(0);
        animHeart.setDepth(200);

        animHeart.setDisplaySize(heart.displayWidth, heart.displayHeight);

        animHeart.play("heartLose");

        animHeart.once("animationcomplete", () => {
            animHeart.destroy();
        });
    }
    const remainingHearts = hearts.filter(h => h.visible).length;

    if (remainingHearts === 0 && !this.isDead) {
        this.killHero();
    }
  }

  // Hero death
  private killHero() {
    if (this.isDead) return;

    this.isDead = true;
    if (this.hero.body) {
      (this.hero.body as Phaser.Physics.Arcade.Body).setVelocity(0, 0);
    }
    this.hero.stop();
    
    this.isAttacking = true;


    this.hero.setTexture(this.userClass+"Death");
    this.hero.play("death" + this.userClass, true);
    fetch("http://localhost:7071/api/update_game_lobby", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            dungeonCode: this.dungeonCode,
            userId: this.user.uid,
            actionType: "PLAYER_DIED",
            targetId: this.userClass
        })
    }).catch(err => console.error(err));

    this.cameras.main.stopFollow();

    this.hero.once("animationcomplete", () => {
        const { width, height } = this.scale;

        const overlay = this.add.rectangle(
            width / 2,
            height / 2,
            width,
            height,
            0x000000,
            0.7
        );
        overlay.setScrollFactor(0);
        overlay.setDepth(200);
        const gameOverText = this.add.text(
            width / 2,
            height / 2 - 80,
            "GAME OVER",
            {
                fontFamily: '"Press Start 2P"',
                fontSize: "32px",
                color: "#ff0000"
            }
        );
        
        gameOverText.setOrigin(0.5);
        gameOverText.setScrollFactor(0);
        gameOverText.setDepth(201);

        const reviveBtn = this.add.text(
            width / 2,
            height / 2,
            "RESUSCITA",
            {
                fontFamily: '"Press Start 2P"',
                fontSize: "16px",
                color: "#ffffff",
                backgroundColor: "#000000",
                padding: { x: 12, y: 8 }
            }
        ).setOrigin(0.5)
         .setScrollFactor(0)
         .setDepth(201)
         .setInteractive({ useHandCursor: true });

        reviveBtn.on("pointerdown", () => {
          overlay.destroy();
          gameOverText.destroy();
          reviveBtn.destroy();
          exitBtn.destroy();
          this.reviveHero();
        });

        const exitBtn = this.add.text(
            width / 2,
            height / 2 + 50,
            "ESCI",
            {
                fontFamily: '"Press Start 2P"',
                fontSize: "16px",
                color: "#ffffff",
                backgroundColor: "#000000",
                padding: { x: 24, y: 8 }
            }
        ).setOrigin(0.5)
         .setScrollFactor(0)
         .setDepth(201)
         .setInteractive({ useHandCursor: true });

        exitBtn.on("pointerdown", () => {
            window.location.href = "homepage.html";
        });
    });
  }
  private reviveHero() {
    const startRoom = this.dungeon.rooms.find(r =>
      r.asset.includes("loginroom")
    );
    if (!startRoom) return;

    this.currentRoom = startRoom;
    this.hero.x = startRoom.x + startRoom.width / 2;
    this.hero.y = startRoom.y + startRoom.height / 2;

    this.isDead = false;
    this.isAttacking = false;
    this.hero.play("death" + this.userClass, true);

    const hearts = this.data.get("hearts") as Phaser.GameObjects.Image[];
    hearts.forEach(h => h.setVisible(true));

    this.cameras.main.startFollow(this.hero);
  }

  private checkWinCondition() {
    if (this.isGameWon) return;

    const activeEnemies = this.enemies.filter(e => e && e.active);
    const activeItems = this.itemsInScene.filter(i => i && i.active);

    if (activeEnemies.length === 0 && activeItems.length === 0){
      this.triggerWin(); 
    }
  }

  private triggerWin() {
    this.isGameWon = true;
    if (this.hero && this.hero.active){
      this.hero.stop();
      this.hero.play("death" + this.userClass, true);
    }

    const winPanel = new GenericPanel("generic-panel", "panel-content", "overlay");
    winPanel.hide = () => {

    };

    const winHtml = `
        <div class="victory-box">
            <h2 class="victory-title">DUNGEON CLEARED!</h2>
            <p class="victory-text">You defeated all enemies<br>and collected all items.</p>
            <button id="win-exit-btn" class="victory-btn">
                RETURN TO HOME
            </button>
        </div>
    `;
    winPanel.show(winHtml);

    const extitBtn = document.getElementById("win-exit-btn");
    if (extitBtn) {
      extitBtn.addEventListener("click", () => {
        window.location.href = "homepage.html";
      });
    }
  }
}
