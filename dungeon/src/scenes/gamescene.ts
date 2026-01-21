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
  constructor() {
    super("GameScene");
  }

  preload() {
    this.load.json("dungeon", "assets/dungeons/dungeon.json");
    this.load.image("hero", "assets/heroes/Cavaliere.png");
    this.load.spritesheet("kng", "assets/KnightAnimation/KnightWalk.png", {
        frameWidth: 290,
        frameHeight: 309
    });
    this.load.spritesheet("kngAttack", "assets/KnightAnimation/KnightAttack.png", {
        frameWidth: 438,
        frameHeight: 408
    });
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
    this.dungeon = this.cache.json.get("dungeon");

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
    });
    this.load.on('filecomplete', (key: string) => {
      console.log("Caricato file: ", key);
    });
    this.load.on('loaderror', (file: any) => {
      console.error("Errore caricamento: ", file.key, file.src);
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
        const e = this.add.sprite(
          room.x + enemy.x,
          room.y + enemy.y,
          "enemy_idle"
        );

        e.setOrigin(0.5, 1);
        e.setScale(scale);
        e.setDepth(3);

        e.setData("state", "idle");
        e.play("enemy_idle");

        this.enemies.push(e);
      });

      room.traps.forEach(trap => {
        const scale = SCALE_RULES.trap;
        const config = TRAP_CONFIG[trap.name];

        if (!config) return;

        const t = this.add.sprite(
          room.x + trap.x,
          room.y + trap.y,
          config.idle
        );
        
        t.setOrigin(0, 0);
        t.setScale(scale);
        t.setDepth(2);

        t.setData("trapName", trap.name);
        t.setData("activated", false);

        this.traps.push(t);
      });
    });
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
      } 
    });
  }

  private updateEnemies() {
  this.enemies.forEach(enemy => {
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
        }
      });
    }

    if (dist > cfg.alertRange && state !== "idle") {
      enemy.setData("state", "idle");
      enemy.play("enemy_idle", true);
    }
  });
}


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

  private initAttack() {
    const attackKey = this.input.keyboard!.addKey(
        Phaser.Input.Keyboard.KeyCodes.SPACE
    );

    attackKey.on("down", () => {
        if (this.isAttacking) return;

        this.isAttacking = true;

        this.hero.setTexture("kngAttack");
        this.hero.play("attack", true).setDisplaySize(130, 130).setOrigin(0.5, 1)
    });

    this.hero.on("animationcomplete", (anim: Phaser.Animations.Animation) => {
        if (anim.key === "attack") {
            this.isAttacking = false;
            this.hero.setTexture("hero").setDisplaySize(130, 130).setOrigin(0.5, 1);
        }
    });
  }

}
