import Phaser from "phaser";
import { getSession } from "../../utils/session";
import { GameUIManager } from "../../ui/gameUIManager";
import { PlayerManager } from "./managers/playerManager";
import { DungeonManager } from "./managers/dungeonManager";
import { NetworkManager } from "./managers/gameNetworkManager";
import { type Dungeon, type RoomSave, type User } from "../../types/types";
import { createArcherAnimations, createEnemyAnimations, createHeartAnimations, createKnightAnimations, createMageAnimations, trapAnimation } from "./animation";

export default class GameScene extends Phaser.Scene {
  //Managers
  public uiManager!: GameUIManager;
  public dungeonManager!: DungeonManager;
  public playerManager!: PlayerManager;
  public networkManager!: NetworkManager;

  //Overall state and UI
  public dungeon!: Dungeon;
  public dungeonCode!: string;
  public enemies: Phaser.GameObjects.Sprite[] = [];
  public hero!: Phaser.GameObjects.Sprite;
  public inventoryPanel?: Phaser.GameObjects.Container;
  public inventorySlots: Phaser.GameObjects.Image[] = [];
  public isGameWon = false;
  public isInventoryOpen: boolean = false;
  public itemsInScene: Phaser.GameObjects.Image[] = [];
  public lobbyId!: string;
  public userClass!: string;
  public user!: User;

  //Dungeon
  public currentRoom!: RoomSave;
  public isTransitioningRoom = false;
  public traps: Phaser.GameObjects.Sprite[] = [];

  //Player
  public isAttacking = false;
  public isDead = false;
  public facingRight: boolean = true;
  public HERO_TARGET_HEIGHT = 120;

  //Network
  public isGuest: boolean = false;
  public otherPlayers: Map<string, Phaser.GameObjects.Sprite> = new Map();
  public lastSyncData = { x: 0, y: 0, anim: "", flipX: false };
  public lastSyncTime = 0;
  

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
    
    this.isGuest = localStorage.getItem("is_game_guest") === "true";

    if (this.isGuest) {
      this.lobbyId = localStorage.getItem("current_lobby_id") || this.dungeonCode; 
    } else {
      this.lobbyId = `${this.dungeonCode}_${this.user.username}`;
    }

  }

  async preload() {
    //Object image & spritesheet
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

    //Hero spritesheet
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
    this.uiManager = new GameUIManager(this);
    this.dungeonManager = new DungeonManager(this);
    this.playerManager = new PlayerManager(this);
    this.networkManager = new NetworkManager(this);

    
    if (!this.anims.exists("walk")) {
      this.createAllAnimations();
    }
    
    await this.networkManager.initNetwork();
    this.uiManager.InteractiveUI();

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
      this.uiManager.createUI();
      this.playerManager.spawnHero();
      this.dungeonManager.buildDungeon();
      this.dungeonManager.initItemPickup();
      this.dungeonManager.spawnRandomItems();
      
      createHeartAnimations(this.anims);
    });
    this.load.on('loaderror', (file: any) => {
      console.error("Errore caricamento: ", file.key, file.src);
    });

    this.load.start();
  }
  update(): void {
    if (this.hero && !this.isDead) {
      this.networkManager.broadcastMovement()
    }
  }

  // Animation
  private createAllAnimations() {
    createKnightAnimations(this.anims);
    createMageAnimations(this.anims);
    createArcherAnimations(this.anims);
    createEnemyAnimations(this.anims);
    trapAnimation(this.anims);
  }  

}
