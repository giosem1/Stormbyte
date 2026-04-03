import Phaser from "phaser";
import { getSession } from "../../utils/session";
import { GameUIManager } from "../../ui/gameUIManager";
import { StoryManager } from "./managers/storyManager";
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
  public stroyManager!: StoryManager;

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
    this.load.setBaseURL("https://stormbyte.blob.core.windows.net/stormbyte-assets/");
    //Object image & spritesheet
    this.load.image("bg-stone", "dark_wall.png");
    this.load.image("bag", "bags.png");
    const rawDungeon = localStorage.getItem("dungeon")
    
    if(!rawDungeon){
      window.location.href = "homepage.html";
      throw new Error("Dungeon not foung");
    }
    this.load.json("dungeon", rawDungeon);
    this.load.image("heart", "heart.png"); 
    this.load.spritesheet("heart_loss", "heart_loss.png", {
        frameWidth: 256,
        frameHeight: 217
    });

    //Hero spritesheet
    //Knight Spritesheet 
    this.load.spritesheet("kng", "KnightAnimation/KnightWalk.png", {
        frameWidth: 290,
        frameHeight: 309
    });
    this.load.spritesheet("kngAttack", "KnightAnimation/KnightAttack.png", {
        frameWidth: 439,
        frameHeight: 408
    });
    this.load.spritesheet("KnightDeath", "KnightAnimation/KnightDeath.png", {
        frameWidth: 361,
        frameHeight: 288
    });
  
    //Mage Spritesheet
    this.load.spritesheet("mg", "MageAnimation/MageWalk.png", {
        frameWidth: 126,
        frameHeight: 260
    });
    this.load.spritesheet("mgAttack", "MageAnimation/MageAttack.png", {
        frameWidth: 383,
        frameHeight: 321
    });
    this.load.spritesheet("MageDeath", "MageAnimation/MageDeath.png", {
        frameWidth: 404,
        frameHeight: 285
    });
    
    //Archer Spritesheet
    this.load.spritesheet("arc", "ArcherAnimation/ArcherWalk.png", {
        frameWidth: 254,
        frameHeight: 264
    });
    this.load.spritesheet("arcAttack", "ArcherAnimation/ArcherAttack.png", {
        frameWidth: 389,
        frameHeight: 378
    });
    this.load.spritesheet("ArcherDeath", "ArcherAnimation/ArcherDeath.png", {
        frameWidth: 293,
        frameHeight: 284
    });
    
    // Traps spritesheet
    this.load.image("spk_idle", "traps/spike.png");
    this.load.spritesheet("spk", "TrapAnimation/Spike_Trap.png", {
      frameWidth: 32,
      frameHeight: 32
    });
    this.load.image("fir_idle", "traps/fire.png");
    this.load.spritesheet("fir", "TrapAnimation/Fire_Trap.png", {
        frameWidth: 32,
        frameHeight: 41
    });
    this.load.image("brt_idle", "traps/bearTrap.png");
    this.load.spritesheet("brt", "TrapAnimation/Bear_Trap.png", {
        frameWidth: 32,
        frameHeight: 32
    });

    // Enemis spritesheet
    this.load.spritesheet("enemy_idle", "enemis/EvilMageIdle.png", {
        frameWidth: 85,
        frameHeight: 94
    });

    this.load.spritesheet("enemy_alert", "enemis/EvilMageAlert.png", {
        frameWidth: 122,
        frameHeight: 110
    });

    this.load.spritesheet("enemy_attack", "enemis/EvilMageAttack.png", {
        frameWidth: 87,
        frameHeight: 110
    });
  }

  async create() {
    this.uiManager = new GameUIManager(this);
    this.dungeonManager = new DungeonManager(this);
    this.playerManager = new PlayerManager(this);
    this.networkManager = new NetworkManager(this);
    this.stroyManager = new StoryManager(this);
    
    if (!this.anims.exists("walk")) {
      this.createAllAnimations();
    }
    
    await this.networkManager.initNetwork();
    this.uiManager.InteractiveUI();

    if (!this.dungeon) {
      throw new Error("Dungeon JSON non caricato");
    }

    const AZURE_BASE_URL = "https://stormbyte.blob.core.windows.net/stormbyte-assets/";
    const getAzureUrl = (path: string) => {
      if (!path) return "";
      
      let cleanPath = path;
      if (cleanPath.includes(AZURE_BASE_URL)){
        cleanPath = cleanPath.replace(AZURE_BASE_URL, "");
      }

      if (cleanPath.includes("http://localhost:5173/")) {
          cleanPath = cleanPath.replace("http://localhost:5173/", "");
      }
      
      cleanPath = cleanPath.startsWith("/") ? cleanPath.substring(1) : cleanPath;
      
      if (cleanPath.startsWith("public/assets/")) {
        cleanPath = cleanPath.substring("public/assets/".length);
      } else if (cleanPath.startsWith("assets/")) {
        cleanPath = cleanPath.substring("assets/".length);
      }
      return cleanPath;
    }

    this.dungeon.rooms.forEach(room => {
      this.load.image(room.id, getAzureUrl(room.asset));

      room.enemies.forEach(e =>
        this.load.image(e.id, getAzureUrl(e.asset))
      );

      room.traps.forEach(t =>
        this.load.image(t.id, getAzureUrl(t.asset))
      );
    });

    this.load.once("complete", () => {
      this.uiManager.createUI();
      this.playerManager.spawnHero();
      this.dungeonManager.buildDungeon();
      this.dungeonManager.initItemPickup();
      this.dungeonManager.spawnRandomItems();
      
      createHeartAnimations(this.anims);
      this.stroyManager.logEvent("DUNGEON_ENTERED", `Has entered the dungeon ${this.dungeon.name}`)
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
    if (this.hero && this.hero.active) {
      const label = this.hero.getData("label") as Phaser.GameObjects.Text;
      if(label) {
        label.x = this.hero.x;
        label.y = this.hero.y - 120;
      }
    }

    this.otherPlayers.forEach((playerSprite) => {
      if (playerSprite && playerSprite.active) {
        const label = playerSprite.getData("label") as Phaser.GameObjects.Text;
        if (label) {
          label.x = playerSprite.x;
          label.y = playerSprite.y - 120;
        }
      }
    });
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
