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
  name: "Spike" | "Fire" | "TrapDoor",
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
  TrapDoor: {
    idle: "trd_idle",
    anim: "trapdActivate"
  }
}

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
  enemy: 0.35,
  trap: 0.4
};

export default class GameScene extends Phaser.Scene {
  private dungeon!: DungeonSave;
  private hero!: Phaser.GameObjects.Sprite;
  private traps: Phaser.GameObjects.Sprite[] = [];
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
    this.load.image("spk_idle", "assets/traps/spikes.png");

    this.load.spritesheet("spk", "assets/TrapAnimation/spkiesAnimation.png", {
      frameWidth: 312,
      frameHeight: 104
    });
    this.load.image("fir_idle", "assets/traps/fire.png");
    this.load.spritesheet("fir", "assets/TrapAnimation/fireAnimation.png", {
        frameWidth: 230,
        frameHeight: 236
    });
    this.load.image("trd_idle", "assets/traps/trapDoor.png");
    this.load.spritesheet("trd", "assets/TrapAnimation/trapDoorAnimation.png", {
        frameWidth: 270,
        frameHeight: 250
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
        const scale = SCALE_RULES.enemy;
        const e = this.add.image(
          room.x + enemy.x,
          room.y + enemy.y,
          enemy.id
        );
        e.setOrigin(0, 0);
        e.setScale(scale);
        e.setDepth(3);
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
        frames: this.anims.generateFrameNumbers("spk", { start: 0, end: 8 }),
        frameRate: 16,
        repeat: 0
      });
    }

    if (!this.anims.exists("fireActivate")) {
      this.anims.create({
        key: "fireActivate",
        frames: this.anims.generateFrameNumbers("fir", { start: 0, end: 8 }),
        frameRate: 5,
        repeat: 0
      });
    }

    if (!this.anims.exists("trapdActivate")) {
      this.anims.create({
        key: "trapdActivate",
        frames: this.anims.generateFrameNumbers("trd", { start: 0, end: 6}),
        frameRate: 5,
        repeat: 0
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
