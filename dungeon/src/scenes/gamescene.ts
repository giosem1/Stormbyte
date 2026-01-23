import Phaser from "phaser";

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

interface RoomSave {
  id: string;
  asset: string;
  x: number;
  y: number;
  width: number;
  height: number;
  enemies: EnemySave[];
  traps: TrapSave[];
}

interface DungeonSave {
  version: number;
  rooms: RoomSave[];
}

const SCALE_RULES: Record<ItemType, number> = {
  room: 1,
  enemy: 1.2,
  trap: 1.8
};

export default class GameScene extends Phaser.Scene {
  private dungeon!: DungeonSave;
  private hero!: Phaser.GameObjects.Sprite;
  private traps: Phaser.GameObjects.Sprite[] = [];
  private enemies: Phaser.GameObjects.Sprite[] = [];
  
  private isAttacking = false;
  private isDead = false;
  constructor() {
    super("GameScene");
  }

  preload() {
    // Object immage & spritesheet
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
        frameWidth: 438,
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

    const exitButton = this.add.text(50, 50, "<-", { fontFamily: '"Press Start 2P"', fontSize: '30px', color: '#ffffff'});
    exitButton.setOrigin(0.5, 0.5);
    exitButton.setScrollFactor(0);
    exitButton.setDepth(100);
    exitButton.setInteractive();
    exitButton.on("pointerdown", () => {
      window.location.href = 'homepage.html';
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
    const maxHealth = 10;
    const heartSpacing = 4; 
    const heartSize = 32; 

    this.load.once("complete", () => {
        const healthContainer = this.add.container(width / 2, height - 50);
        healthContainer.setScrollFactor(0);
        healthContainer.setDepth(100);

        const hearts: Phaser.GameObjects.Image[] = [];

        for (let i = 0; i < maxHealth; i++) {
            const heart = this.add.image(
                -((maxHealth - 1) * (heartSize + heartSpacing)) / 2 + i * (heartSize + heartSpacing),
                0,
                "heart"
            );
            heart.setOrigin(0, 0);
            heart.setDisplaySize(heartSize, heartSize);
            healthContainer.add(heart);
            hearts.push(heart);
        }

        this.data.set("hearts", hearts);
        this.data.set("maxHealth", maxHealth);
    });
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

        e.setOrigin(0.5, 1);
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
    const RANGE = 80;

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
      if (hearts) {
        hearts.forEach((h, i) => {
          h.x = enemy.x - 12 + i * 12;
          h.y = enemy.y - enemy.displayHeight - 10;
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

    const x = startRoom.x + startRoom.width / 2;
    const y = startRoom.y + startRoom.height / 2;

    this.hero = this.add.sprite(x, y, "hero").setScale(0.3).setOrigin(0.5, 1);
    this.hero.setDepth(10);

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
      if (this.isAttacking) return;
      const dt = delta / 1000;
      let moving = false;

      if (cursors.left?.isDown || keys.left?.isDown) {
          this.hero.x -= speed * dt;
          this.hero.play("walk", true).setDisplaySize(130, 130).setOrigin(0.5, 1);
          this.hero.flipX = true;
          moving = true;
      } else if (cursors.right?.isDown || keys.right?.isDown) {
          this.hero.x += speed * dt;
          this.hero.play("walk", true).setDisplaySize(130, 130).setOrigin(0.5, 1);
          this.hero.flipX = false;
          moving = true;
      } else if (cursors.up?.isDown || keys.up?.isDown) {
          this.hero.y -= speed * dt;
          this.hero.play("walk", true).setDisplaySize(130, 130).setOrigin(0.5, 1);
          moving = true;
      } else if (cursors.down?.isDown || keys.down?.isDown) {
          this.hero.y += speed * dt;
          this.hero.play("walk", true).setDisplaySize(130, 130).setOrigin(0.5, 1);
          moving = true;
      }
        
      if (!moving && !this.isAttacking) {
        this.hero.stop();
        this.hero.setTexture("hero").setDisplaySize(130, 130).setOrigin(0.5, 1);
      }
      this.activeTraps();
      this.updateEnemies();
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
      hearts[hp].setVisible(false);
    }

    if (hp === 0) {
      enemy.stop();
      if (hearts) {
        hearts.forEach(h => h.destroy());
      }

      enemy.destroy();
      this.enemies = this.enemies.filter(e => e !== enemy);
    }
  }

  private initAttack() {
    const attackKey = this.input.keyboard!.addKey(
        Phaser.Input.Keyboard.KeyCodes.SPACE
    );

    attackKey.on("down", () => {
        if (this.isAttacking) return;

        this.isAttacking = true;

        this.hero.setTexture("kngAttack");
        this.hero.play("attack", true).setDisplaySize(130, 130).setOrigin(0.5, 1);
        this.enemies.forEach(enemy => {
        const d = Phaser.Math.Distance.Between(
          this.hero.x,
          this.hero.y,
          enemy.x,
          enemy.y
        );

        if (d < 80) {
          this.damageEnemy(enemy);
        }
      });
    });

    this.hero.on("animationcomplete", (anim: Phaser.Animations.Animation) => {
        if (anim.key === "attack") {
            this.isAttacking = false;
            this.hero.setTexture("hero").setDisplaySize(130, 130).setOrigin(0.5, 1);
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
    this.hero.setScale(0.3); // ← basta questo
    this.hero.setOrigin(0.5, 1);
    this.hero.play("death");

    this.cameras.main.stopFollow();

    this.hero.once("animationcomplete", () => {
        const { width, height } = this.scale;

        // overlay
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

        // GAME OVER
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
            this.scene.restart(); // ← ORA FUNZIONA
        });

        // ESCI
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

}
