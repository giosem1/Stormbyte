import Phaser from "phaser";
import GenericPanel from "../ui/pannel";

type ItemType = "room" | "enemy" | "trap";

interface EnemySave {
  id: string;
  asset: string;
  x: number;
  y: number;
}

interface TrapSave {
  id: string;
  asset: string;
  name: "Spike" | "Fire" | "BearTrap",
  x: number;
  y: number;
}

const TRAP_CONFIG = {
  Spike: {
    idle: "spk_idle",
    anim: "spikeActivate"
  },
  Fire: {
    idle: "fir_idle",
    anim: "fireActivate"
  },
  BearTrap: {
    idle: "brt_idle",
    anim: "beartActivate"
  }
}
const ENEMY_CONFIG = {
  default: {
    idle: "enemy_idle",
    alert: "enemy_alert",
    attack: "enemy_attack",
    alertRange: 150,
    alertDuration: 400
  }
};

interface DoorSave {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  targetRoomId: string;
  spawnX: number;
  spawnY: number;
}

interface RoomSave {
  id: string;
  asset: string;
  x: number;
  y: number;
  width: number;
  height: number;
  doors: DoorSave[];
  enemies: EnemySave[];
  traps: TrapSave[];
}

interface DungeonSave {
  name: string;
  version: number;
  rooms: RoomSave[];
}

const SCALE_RULES: Record<ItemType, number> = {
  room: 1.2,
  enemy: 1,
  trap: 1.5
};
const HERO_TARGET_HEIGHT = 120;

export default class GameScene extends Phaser.Scene {
  private dungeon!: DungeonSave;
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
  constructor() {
    super("GameScene");
  }

  preload() {
    // Object image & spritesheet
    this.load.image("bg-stone", "assets/dark_wall.png");
    this.load.image("bag", "assets/user/bags.png");
    this.load.json("dungeon", "assets/dungeons/dungeon.json");
    this.load.image("heart", "assets/heart.png"); 
    this.load.spritesheet("heart_loss", "assets/heart_loss.png", {
        frameWidth: 256,
        frameHeight: 217
    });

    // Hero spritesheet
    this.load.image("hero", "assets/heroes/Cavaliere.png");
    this.load.spritesheet("kng", "assets/KnightAnimation/KnightWalk.png", {
        frameWidth: 290,
        frameHeight: 309
    });
    this.load.spritesheet("kngAttack", "assets/KnightAnimation/KnightAttack.png", {
        frameWidth: 439,
        frameHeight: 408
    });
    this.load.spritesheet("kngDeath", "assets/KnightAnimation/KnightDeath.png", {
        frameWidth: 361,
        frameHeight: 288
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

  create() {
     if (!this.anims.exists("walk")) {
        this.createAllAnimations();
    } 
    this.dungeon = this.cache.json.get("dungeon");
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
      console.log("Apri inventario");
    });
    bagIcon.on("pointerdown", () => {
      this.toggleInventory();
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
      const panel = new GenericPanel("panel", "panel-content", "panel-overlay");

      const friendsList = [
          { name: "Luca Rossi", uid: "102938", avatar: "/assets/user/placeholder.png" },
          { name: "Sara Bianchi", uid: "847362", avatar: "/assets/user/placeholder.png" },
          { name: "Marco Verdi", uid: "554221", avatar: "/assets/user/placeholder.png" }
      ];

      const friendsHTML = friendsList.map(friend => `
          <div class="friend-row flex items-center justify-between border rounded-lg p-3">
              <div class="flex items-center">
                  <img src="${friend.avatar}" alt="Avatar" class="w-12 h-12 rounded-full object-cover mr-4"/>
                  <div class="flex flex-col">
                      <span class="text-white font-semibold text-lg">${friend.name}</span>
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
              console.log(`Invito inviato a: ${friend.name} (UID: ${friend.uid})`);
              button.textContent = "✓";
              button.disabled = true;
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
      this.createEnemyAnimations();
      this.trapAnimation();
      this.buildDungeon();
      this.spawnHero();
      this.createUI();
      this.createHeartAnimations();
      this.spawnRandomItems();
      this.initItemPickup();
    });
    this.load.on('filecomplete', (key: string) => {
      console.log("Caricato file: ", key);
    });
    this.load.on('loaderror', (file: any) => {
      console.error("Errore caricamento: ", file.key, file.src);
    });
    this.load.start();
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
          console.log(this.dungeon.name)
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

    const bg = this.add.rectangle(0, 0, 300, 400, 0x4b3b2a, 0.9);
    bg.setStrokeStyle(4, 0x000000);
    this.inventoryPanel.add(bg);

    const title = this.add.text(0, -180, "Inventario", {
        fontFamily: '"Press Start 2P"',
        fontSize: "16px",
        color: "#FFD700"
    }).setOrigin(0.5);
    this.inventoryPanel.add(title);

    const closeBtn = this.add.text(0, 180, "CHIUDI", {
        fontFamily: '"Press Start 2P"',
        fontSize: "16px",
        color: "#ffffff",
        backgroundColor: "#000000",
        padding: { x: 12, y: 6 }
    }).setOrigin(0.5)
     .setInteractive({ useHandCursor: true });
    closeBtn.on("pointerdown", () => this.toggleInventory());
    this.inventoryPanel.add(closeBtn);

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


      room.enemies.forEach(enemy => {
        const e = this.add.sprite(room.x + enemy.x, room.y + enemy.y, "enemy_idle");

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

      room.traps.forEach(trap => {
        const scale = SCALE_RULES.trap;
        const config = TRAP_CONFIG[trap.name];

        if (!config) return;

        const t = this.add.sprite(room.x + trap.x, room.y + trap.y, config.idle);
        
        t.setOrigin(0, 0);
        t.setScale(scale);
        t.setDepth(2);

        t.setData("trapName", trap.name);
        t.setData("activated", false);

        this.traps.push(t);
      });
    });
  }


  private toggleInventory() {
    if (!this.inventoryPanel) return;

    this.isInventoryOpen = !this.isInventoryOpen;
    this.inventoryPanel.setVisible(this.isInventoryOpen);

    this.inventorySlots.forEach(slot => {
        if (slot.getData("filled")) {
            slot.setVisible(this.isInventoryOpen);
        }
    });
  }

  // Spawn and collectiong items
  private spawnRandomItems() {
    const itemAssets = [
        { key: "potion", asset: "assets/items/potion_health.png" },
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
        this.dungeon.rooms.forEach(room => {
            const numItems = Phaser.Math.Between(1, 3);

            for (let i = 0; i < numItems; i++) {
                const item = Phaser.Math.RND.pick(itemAssets);
                const centerX = room.x + room.width / 2;
                const centerY = room.y + room.height / 2;

                const rangeX = room.width / 4;
                const rangeY = room.height / 4;

                const x = Phaser.Math.Between(centerX - rangeX, centerX + rangeX);
                const y = Phaser.Math.Between(centerY - rangeY, centerY + rangeY);

                const obj = this.add.image(x, y, item.key);
                obj.setOrigin(0.5, 0.5);
                obj.setDepth(5);
                obj.setScale(2);

                obj.setData("itemKey", item.key);
                obj.setData("roomId", room.id);

                this.itemsInScene.push(obj);
                obj.setInteractive({ useHandCursor: true });
                obj.on("pointerdown", () => {
                    this.collectItem(obj);
                });
                this.itemsInScene.push(obj);
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
        console.log("Inventario pieno!");
        return;
    }

    const slot = this.inventorySlots[slotIndex];
    slot.setTexture(item.getData("itemKey"));
    slot.setData("filled", true);
    slot.setData("itemKey", item.getData("itemKey"));

    if (this.isInventoryOpen) {
        slot.setVisible(true);
    }

    item.destroy();
    this.itemsInScene = this.itemsInScene.filter(i => i !== item);
    console.log("Raccolto:", slot.getData("itemKey"));
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

    const roomRect = new Phaser.Geom.Rectangle(r.x, r.y, r.width, r.height);

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
            nextRoom.x + 20,
            nextRoom.x + nextRoom.width - 20
        );
        this.hero.y = Phaser.Math.Clamp(
            this.hero.y,
            nextRoom.y + 20,
            nextRoom.y + nextRoom.height - 20
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
    this.createKnightAnimations();
    this.createEnemyAnimations();
    this.trapAnimation();
  }  

  private createKnightAnimations() {
    if (!this.anims.exists("walk")) {
        this.anims.create({
            key: "walk",
            frames: this.anims.generateFrameNumbers("kng", { start: 0, end: 35 }),
            frameRate: 9,
            repeat: -1
        });
    }
    if (!this.anims.exists("attack")) {
      console.log("active attack")
        this.anims.create({
            key: "attack",
            frames: this.anims.generateFrameNumbers("kngAttack", { start: 0, end: 35 }),
            frameRate: 16,
            repeat: 0
        });
    }
    if (!this.anims.exists("death")) {
        this.anims.create({
            key: "death",
            frames: this.anims.generateFrameNumbers("kngDeath", { start: 0, end: 35 }),
            frameRate: 10,
            repeat: 0
        });
    }
  }
  
  private trapAnimation() {
     if (!this.anims.exists("spikeActivate")) {
      this.anims.create({
        key: "spikeActivate",
        frames: this.anims.generateFrameNumbers("spk", { start: 0, end: 13 }),
        frameRate: 16,
        repeat: 0
      });
    }

    if (!this.anims.exists("fireActivate")) {
      this.anims.create({
        key: "fireActivate",
        frames: this.anims.generateFrameNumbers("fir", { start: 0, end: 13 }),
        frameRate: 5,
        repeat: 0
      });
    }

    if (!this.anims.exists("beartActivate")) {
      this.anims.create({
        key: "beartActivate",
        frames: this.anims.generateFrameNumbers("brt", { start: 0, end: 3}),
        frameRate: 5,
        repeat: 0
      });
    }
  }

  private createEnemyAnimations() {
    if (!this.anims.exists("enemy_idle")) {
      this.anims.create({
        key: "enemy_idle",
        frames: this.anims.generateFrameNumbers("enemy_idle", { start: 0, end: 7 }),
        frameRate: 6,
        repeat: -1
      });
    }

    if (!this.anims.exists("enemy_alert")) {
      this.anims.create({
        key: "enemy_alert",
        frames: this.anims.generateFrameNumbers("enemy_alert", { start: 0, end: 7 }),
        frameRate: 8,
        repeat: -1
      });
    }

    if (!this.anims.exists("enemy_attack")) {
      this.anims.create({
        key: "enemy_attack",
        frames: this.anims.generateFrameNumbers("enemy_attack", { start: 0, end: 7 }),
        frameRate: 12,
        repeat: -1
      });
    }
  }
  
  private createHeartAnimations() {
    if (!this.anims.exists("heartLose")) {
        this.anims.create({
            key: "heartLose",
            frames: this.anims.generateFrameNumbers("heart_loss", {
                start: 0,
                end: 15
            }),
            frameRate: 12,
            repeat: 0
        });
    }
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
        console.log(config.anim)
        
        trap.play(config.anim);
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
      const heroC = this.hero.getCenter();
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
  
        this.time.delayedCall(cfg.alertDuration, () => {
          if (enemy.getData("state") === "alert") {
            enemy.setData("state", "attack");
            enemy.play("enemy_attack", true);
  
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
      }
    });
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

    this.hero = this.add.sprite(x, y, "kngDeath", 0);
    this.hero.setOrigin(0.5, 1);
    this.hero.setDepth(10);
    const frame = this.textures.get("kngDeath").get("0");
    const scale = HERO_TARGET_HEIGHT / frame.height;
    this.hero.setScale(scale);

    this.isDead = false;
    this.isAttacking = false;
    this.cameras.main.startFollow(this.hero);
    this.cameras.main.setZoom(1);
    this.createKnightAnimations();
    this.initMovement();
    this.initAttack();
  }

  // Hero movement
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
      if (this.isAttacking) return;
      const dt = delta / 1000;
      let moving = false;

      if (cursors.left?.isDown || keys.left?.isDown) {
          this.hero.x -= speed * dt;
          this.hero.play("walk", true);
          this.hero.flipX = true;
          moving = true;
      } else if (cursors.right?.isDown || keys.right?.isDown) {
          this.hero.x += speed * dt;
          this.hero.play("walk", true);
          this.hero.flipX = false;
          moving = true;
      } else if (cursors.up?.isDown || keys.up?.isDown) {
          this.hero.y -= speed * dt;
          this.hero.play("walk", true);
          moving = true;
      } else if (cursors.down?.isDown || keys.down?.isDown) {
          this.hero.y += speed * dt;
          this.hero.play("walk", true);
          moving = true;
      }
        
      if (!moving && !this.isAttacking) {
        this.hero.stop();
        this.hero.setTexture("kngDeath", 0); 
      }
      this.activeTraps();
      this.updateEnemies();
      this.clampAndHandleRoomTransition(prevX, prevY);
    });
  }

  // Hero attack
  private damageEnemy(enemy: Phaser.GameObjects.Sprite) {
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
  
      this.hero.play("attack", true);
  
      const attackHitbox = this.getAttackHitbox();
  
      this.enemies.forEach(enemy => {
          const enemyRect = enemy.getBounds();
  
          if (Phaser.Geom.Rectangle.Overlaps(attackHitbox, enemyRect)) {
              this.damageEnemy(enemy);
          }
      });
  });

    this.hero.on("animationcomplete", (anim: Phaser.Animations.Animation) => {
        if (anim.key === "attack") {
            this.isAttacking = false;
            this.hero.setTexture("kngDeath", 0);
        }
    });
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
    this.isAttacking = true;

    this.hero.stop();

    this.hero.setTexture("kngDeath");
    this.hero.play("death");

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
    this.hero.setTexture("kng", 0);

    const hearts = this.data.get("hearts") as Phaser.GameObjects.Image[];
    hearts.forEach(h => h.setVisible(true));

    this.cameras.main.startFollow(this.hero);
  }
}
