import Phaser from "phaser";
import GameScene from "../gamescene";
import { ENEMY_CONFIG, TRAP_CONFIG, type ItemType } from "../../../types/types";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
export const SCALE_RULES: Record<ItemType, number> = {
  room: 1.2,
  enemy: 1,
  trap: 1.5
};

export const WALL_THICKNESS = 40;
export const DOOR_WIDTH = 80;

export class DungeonManager {
    private scene: GameScene;

    constructor(scene: GameScene){
        this.scene = scene;
    }

    public spawnRandomItems() {
        const itemAssets = [
                { key: "potion", asset: "items/potion.png" },
                { key: "emerald", asset: "items/emerald.png" },
                { key: "rubin", asset: "items/rubin.png" },
                { key: "sword", asset: "items/sword.png" },
                { key: "shield", asset: "items/shield.png" }
            ];
            
            itemAssets.forEach(item => {
                if (!this.scene.textures.exists(item.key)) {
                    this.scene.load.image(item.key, item.asset);
                }
            });
        
            this.scene.load.once("complete", () => {
              Phaser.Math.RND.sow([this.scene.dungeonCode]);
                this.scene.dungeon.rooms.forEach(room => {
                    const numItems = Phaser.Math.RND.between(1, 3);
        
                    for (let i = 0; i < numItems; i++) {
                        const item = Phaser.Math.RND.pick(itemAssets);
                        const centerX = room.x + room.width / 2;
                        const centerY = room.y + room.height / 2;
        
                        const rangeX = room.width / 4;
                        const rangeY = room.height / 4;
        
                        const x = Phaser.Math.RND.between(centerX - rangeX, centerX + rangeX);
                        const y = Phaser.Math.RND.between(centerY - rangeY, centerY + rangeY);
        
                        const obj = this.scene.add.image(x, y, item.key);
                        obj.setOrigin(0.5, 0.5);
                        obj.setDepth(5);
                        obj.setScale(2);
        
                        const uniqueItemId = `${room.id}_item_${i}`;
                        obj.setData("itemId", uniqueItemId);
        
                        obj.setData("itemKey", item.key);
                        obj.setData("roomId", room.id);
        
                        this.scene.itemsInScene.push(obj);
                        obj.setInteractive({ useHandCursor: true });
                        obj.on("pointerdown", () => {
                            this.collectItem(obj);
                        });
                    }
                });
            });
        
            this.scene.load.start();
    }

    public initItemPickup() {
        const pickupKey = this.scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.E);
        
            this.scene.events.on("update", () => {
                if (Phaser.Input.Keyboard.JustDown(pickupKey)) {
                    this.scene.itemsInScene.forEach(item => {
                        const dist = Phaser.Math.Distance.Between(this.scene.hero.x, this.scene.hero.y, item.x, item.y);
        
                        if (dist < 50) {
                            this.collectItem(item);
                        }
                    });
                }
            });
    }

    public buildDungeon(){
        this.scene.dungeon.rooms.forEach(room => {
            const scale = SCALE_RULES.room;

            const roomImg = this.scene.add.image(room.x, room.y, room.id);
            roomImg.setOrigin(0, 0);
            roomImg.setScale(scale);
            roomImg.setDepth(1);


            room.enemies.forEach((enemy, index) => {
                const e = this.scene.add.sprite(room.x + enemy.x, room.y + enemy.y, "enemy_idle");

                const uniqueEnemyId = `${room.id}_enemy_${index}`;
                e.setData("enemyId", uniqueEnemyId);
                e.setOrigin(0, 0);
                e.setScale(scale);
                e.setDepth(3);

                e.setData("state", "idle");
                e.play("enemy_idle");

                this.scene.enemies.push(e);
                e.setData("hp", 3);
                const hearts: Phaser.GameObjects.Image[] = [];

                for (let i = 0; i < 3; i++) {
                const h = this.scene.add.image(e.x - 12 + i * 12, e.y - e.displayHeight - 10, "heart");
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

                const t = this.scene.add.sprite(room.x + trap.x, room.y + trap.y, config.idle);
                t.setOrigin(0, 0);
                t.setScale(scale);
                t.setDepth(2);
                
                const uniqueTrapId = `${room.id}_trap_${index}`;
                t.setData("trapId", uniqueTrapId);

                t.setData("trapName", trap.name);
                t.setData("activated", false);

                this.scene.traps.push(t);
            });
        });
    }

    //Collect Item
    private collectItem(item: Phaser.GameObjects.Image) {
      const itemKey = item.getData("itemKey");
      const itemId = item.getData("itemId");


      const existingSlotItem = this.scene.inventorySlots.findIndex(s => s.getData("filled") && s.getData("itemKey") === itemKey);
      let targetSlot: Phaser.GameObjects.Image;
      
      if (existingSlotItem !== -1){
        targetSlot = this.scene.inventorySlots[existingSlotItem];
        let currentCount = targetSlot.getData("count") || 1;
        currentCount++;
        targetSlot.setData("count", currentCount);

        let countText = targetSlot.getData("countText") as Phaser.GameObjects.Text;
        if(countText){
          countText.setText(`x${currentCount}`);
          if (this.scene.isInventoryOpen) countText.setVisible(true);
        }
        if (!countText) {
          countText = this.scene.add.text(targetSlot.x + 8, targetSlot.y +8, `x${currentCount}`, {
            fontSize: '14px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 3
          });
          countText.setDepth(200);
          this.scene.inventoryPanel!.add(countText);
          targetSlot.setData("countText", countText);
        } else {
          countText.setText(`x${currentCount}`);
        }

        if (this.scene.isInventoryOpen) {
          countText.setVisible(true);
        }
      } else {
        const emptySlotIndex = this.scene.inventorySlots.findIndex(s => !s.getData("filled"));
        if (emptySlotIndex === -1) {
            return;
        }
        const targetSlot = this.scene.inventorySlots[emptySlotIndex];
        targetSlot.setTexture(item.getData("itemKey"));
        targetSlot.setData("filled", true);
        targetSlot.setData("itemKey", item.getData("itemKey"));
        targetSlot.setData("count", 1);
        let  countText = this.scene.add.text(targetSlot.x + 8, targetSlot.y +8, `x1`, {
            fontSize: '14px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 3
          });
        countText.setDepth(200);
        this.scene.inventoryPanel!.add(countText);
        targetSlot.setData("countText", countText);
        
        if (this.scene.isInventoryOpen) {
            targetSlot.setVisible(true);
            countText.setVisible(true);
        } else {
          targetSlot.setVisible(false);
          countText.setVisible(false);
        }

      }
  
      fetch(`${API_BASE_URL}/update_game_lobby`, {
        method:"POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dungeonCode: this.scene.dungeonCode,
          lobbyId: this.scene.lobbyId,
          userId: this.scene.user.uid,
          actionType: "ITEM_COLLECTED",
          targetId: itemId,
          username: this.scene.user.username
        })
      }).catch(err => console.error(err));
  
      this.scene.stroyManager.logEvent("ITEM_COLLECTED", `Discovered a precious treasure: ${item.getData("itemKey")}.`, this.scene.user.username);

      item.destroy();
      this.scene.uiManager.checkWinCondition()
      this.scene.itemsInScene = this.scene.itemsInScene.filter(i => i !== item);
    }

    // Traps
  public activeTraps() {
    const RANGE = 50;

    this.scene.traps.forEach(trap => {
      if (trap.getData("activated")) return;

      const heroC = this.scene.hero.getCenter();
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
        
        this.scene.stroyManager.logEvent("TRAP_TRIGGERED", `A fatal misstep! Triggered a hidden trap.`, this.scene.user.username);
        trap.play(config.anim);
        fetch(`${API_BASE_URL}/update_game_lobby`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            dungeonCode: this.scene.dungeonCode,
            lobbyId: this.scene.lobbyId,
            userId: this.scene.user.uid,
            actionType: "TRAP_ACTIVATED",
            targetId: trap.getData("trapId")
          })
        }).catch(err => console.error(err));

        trap.once("animationcomplete", () => {
          trap.setTexture(config.idle);
          trap.setData("activated", false);
        });
        this.scene.playerManager.takeDamage(1)
      } 
    });
  }

  // Enemies
  public updateEnemies() {
    this.scene.enemies.forEach(enemy => {
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

      let minDist = Phaser.Math.Distance.Between(this.scene.hero.x, this.scene.hero.y, enemyC.x, enemyC.y);

      this.scene.otherPlayers.forEach((otherHero) => {
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
        
        this.scene.networkManager.broadcastEnemyState(enemy.getData("enemyId"), "alert");

        this.scene.time.delayedCall(cfg.alertDuration, () => {
          if (enemy.getData("state") === "alert") {
            enemy.setData("state", "attack");
            enemy.play("enemy_attack", true);
            
            this.scene.networkManager.broadcastEnemyState(enemy.getData("enemyId"), "attack");

            this.scene.time.delayedCall(500, () => {
              if (!this.scene.isDead && Phaser.Math.Distance.Between(this.scene.hero.x, this.scene.hero.y, enemyC.x, enemyC.y) <= cfg.alertRange) {
                this.scene.playerManager.takeDamage(2);
              }
            });
          }
        });
      }

      if (minDist > cfg.alertRange && state !== "idle") {
        enemy.setData("state", "idle");
        enemy.play("enemy_idle", true);
        
        this.scene.networkManager.broadcastEnemyState(enemy.getData("enemyId"), "idle");
      }

    });
  }

    public getHeroHitbox(): Phaser.Geom.Rectangle {
        const width = 40;
        const height = 20;
    
        return new Phaser.Geom.Rectangle(
            this.scene.hero.x - width / 2,
            this.scene.hero.y - height,
            width,
            height
        );
      }

    public clampAndHandleRoomTransition(prevX: number, prevY: number) {
        if (!this.scene.currentRoom || this.scene.isTransitioningRoom) return;
    
        const r = this.scene.currentRoom;
        const hitbox = this.getHeroHitbox();
    
        const roomRect = new Phaser.Geom.Rectangle(r.x, r.y, r.width * SCALE_RULES.room, r.height * SCALE_RULES.room);
    
        if (Phaser.Geom.Rectangle.ContainsRect(roomRect, hitbox)) {
            return;
        }
        const nextRoom = this.scene.dungeon.rooms.find(other => {
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
            this.scene.isTransitioningRoom = true;
            this.scene.currentRoom = nextRoom;

            this.scene.stroyManager.logEvent("ROOM_ENTERED", `The air grows cold as they delve into a new area of the dungeon.`, this.scene.user.username);
            this.scene.hero.x = Phaser.Math.Clamp(
                this.scene.hero.x,
                nextRoom.x + WALL_THICKNESS,
                nextRoom.x + (nextRoom.width * SCALE_RULES.room) - WALL_THICKNESS
            );
            this.scene.hero.y = Phaser.Math.Clamp(
                this.scene.hero.y,
                nextRoom.y + WALL_THICKNESS,
                nextRoom.y + (nextRoom.height * SCALE_RULES.room) - WALL_THICKNESS
            );
    
            this.scene.time.delayedCall(0, () => {
                this.scene.isTransitioningRoom = false;
            });
    
            return;
        }
        this.scene.hero.x = prevX;
        this.scene.hero.y = prevY;
      }
}