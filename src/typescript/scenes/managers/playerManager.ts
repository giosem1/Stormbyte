import Phaser from "phaser";
import GameScene from "../gamescene";
import GenericPanel from "../../../ui/pannel";
import { SCALE_RULES, WALL_THICKNESS, DOOR_WIDTH } from "./dungeonManager";
import { createKnightAnimations } from "../animation";

export class PlayerManager {
    private scene: GameScene;

    constructor(scene: GameScene) {
        this.scene = scene;
    }

     private getTextureKey(playerClass: string): string {
        switch (playerClass.toLowerCase()) {
          case "mage": return "mg";
          case "archer": return "arc";
          case "knight": 
          default: return "kng";
        }
      }
    
      public spawnHero() {
        const startRoom = this.scene.dungeon.rooms.find(r =>
          r.asset.includes("loginroom")
        );
    
        if (!startRoom) {
          throw new Error("loginroom non trovata");
        }
        this.scene.currentRoom = startRoom; 
    
        const x = startRoom.x + startRoom.width / 2;
        const y = startRoom.y + startRoom.height / 2;
        const textureKey = this.getTextureKey(this.scene.userClass);
        this.scene.hero = this.scene.add.sprite(x, y, textureKey, 0);
        this.scene.hero.setOrigin(0.5, 1);
        this.scene.hero.setDepth(10);
        const frame = this.scene.textures.get(this.scene.userClass+"Death").get("0");
        const scale = this.scene.HERO_TARGET_HEIGHT / frame.height;
        this.scene.hero.setScale(scale);
    
        this.scene.isDead = false;
        this.scene.isAttacking = false;
        this.scene.cameras.main.startFollow(this.scene.hero);
        this.scene.cameras.main.setZoom(1);
        createKnightAnimations(this.scene.anims);
        this.initMovement();
        this.initAttack();
      }
    
      //Hero movement
      private initMovement() {
        const cursors = this.scene.input.keyboard!.createCursorKeys();
        const speed = 200;
    
        const keys = this.scene.input.keyboard!.addKeys({
            up: Phaser.Input.Keyboard.KeyCodes.W,
            down: Phaser.Input.Keyboard.KeyCodes.S,
            left: Phaser.Input.Keyboard.KeyCodes.A,
            right: Phaser.Input.Keyboard.KeyCodes.D
        }) as any;
    
        this.scene.events.on("update", (_: any, delta: number) => {
          const prevX = this.scene.hero.x;
          const prevY = this.scene.hero.y;
          if (this.scene.isAttacking || this.scene.isDead || this.scene.isGameWon){
            if (this.scene.isGameWon && this.scene.hero.active) this.scene.hero.stop();
            return;
          } 
          const dt = delta / 1000;
          let moving = false;
    
          if (cursors.left?.isDown || keys.left?.isDown) {
              this.scene.hero.x -= speed * dt;
              this.scene.facingRight = false;
              this.scene.hero.play("walk"+this.scene.userClass, true);
              moving = true;
          } else if (cursors.right?.isDown || keys.right?.isDown) {
              this.scene.hero.x += speed * dt;
              this.scene.facingRight = true; 
              this.scene.hero.play("walk"+this.scene.userClass, true);
              moving = true;
          } else if (cursors.up?.isDown || keys.up?.isDown) {
              this.scene.hero.y -= speed * dt;
              this.scene.hero.play("walk"+this.scene.userClass, true);
              moving = true;
          } else if (cursors.down?.isDown || keys.down?.isDown) {
              this.scene.hero.y += speed * dt;
              this.scene.hero.play("walk"+this.scene.userClass, true);
              moving = true;
          }
            
          if (!moving && !this.scene.isAttacking) {
            this.scene.hero.stop();
            this.scene.hero.setTexture(this.scene.userClass+"Death", 0);
          }
    
          this.updateHeroFacing();
    
          if (this.scene.hero && this.scene.currentRoom && !this.scene.isTransitioningRoom){
            const roomCenterX = this.scene.currentRoom.x + (this.scene.currentRoom.width * SCALE_RULES.room) / 2;
            const roomCenterY = this.scene.currentRoom.y + (this.scene.currentRoom.height * SCALE_RULES.room) / 2;
    
            const minX = this.scene.currentRoom.x + WALL_THICKNESS;
            const maxX = this.scene.currentRoom.x + (this.scene.currentRoom.width * SCALE_RULES.room) - WALL_THICKNESS;
            const minY = this.scene.currentRoom.y + WALL_THICKNESS;
            const maxY = this.scene.currentRoom.y + (this.scene.currentRoom.height * SCALE_RULES.room) - WALL_THICKNESS;
    
            const isAtHorizontalDoor = Math.abs(this.scene.hero.y - roomCenterY) < (DOOR_WIDTH / 2);
            const isAtVerticalDoor = Math.abs(this.scene.hero.x - roomCenterX) < (DOOR_WIDTH / 2);
    
            if (!isAtHorizontalDoor){
              if (this.scene.hero.x < minX) this.scene.hero.x = minX;
              if (this.scene.hero.x > maxX) this.scene.hero.x = maxX;
            }
    
            if (!isAtVerticalDoor) {
              if (this.scene.hero.y < minY) this.scene.hero.y = minY;
              if (this.scene.hero.y > maxY) this.scene.hero.y = maxY; 
            }
          }
          this.scene.dungeonManager.activeTraps();
          this.scene.dungeonManager.updateEnemies();
          this.scene.dungeonManager.clampAndHandleRoomTransition(prevX, prevY);
        });
      }
    
      //Hero attack
      private damageEnemy(enemy: Phaser.GameObjects.Sprite) {
        const enemyId = enemy.getData("enemyId");
    
        fetch("http://localhost:7071/api/update_game_lobby", {
          method:"POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            dungeonCode: this.scene.dungeonCode,
            lobbyId: this.scene.lobbyId,
            userId: this.scene.user.uid,
            actionType: "ENEMY_DAMAGED",
            targetId: enemyId,
            username: this.scene.user.username
          })
        }).catch(err => console.error(err));
    
        this.applyEnemyDamageVisual(enemy);
      }
    
      public applyEnemyDamageVisual(enemy: Phaser.GameObjects.Sprite) {
        let hp = enemy.getData("hp");
        if (hp <= 0) return;
    
        hp--;
        enemy.setData("hp", hp);
      
        const hearts = enemy.getData("hearts") as Phaser.GameObjects.Image[];
        if (hearts && hearts[hp]) {
            const heart = hearts[hp];
            this.scene.time.delayedCall(1000, () => {
                heart.setVisible(false);
            });
        }
      
        if (hp === 0) {
          enemy.stop();
          if (hearts) {
              hearts.forEach((h, i) => {
                  this.scene.time.delayedCall(i * 900, () => h.destroy());
              });
          }
      
          enemy.destroy();
          this.scene.enemies = this.scene.enemies.filter(e => e !== enemy);
          
          this.scene.stroyManager.logEvent("ENEMY_DEFEATED", `Delivered a lethal blow, felling a dark creature.`, this.scene.user.username);
          this.scene.uiManager.checkWinCondition();
        }
      }
    
      private getAttackHitbox(): Phaser.Geom.Rectangle {
        if (!this.scene.hero.frame) return new Phaser.Geom.Rectangle(this.scene.hero.x, this.scene.hero.y, 0, 0);
    
        const scale = this.scene.hero.scale;
        const width = this.scene.hero.frame.width * scale;
        const height = this.scene.hero.frame.height * scale;
        const offsetX = this.scene.hero.flipX ? -width * 0.5 : width * 0.5;
        const offsetY = -height * 0.5;
    
        return new Phaser.Geom.Rectangle(
            this.scene.hero.x + offsetX - width / 2,
            this.scene.hero.y + offsetY - height / 2,
            width,
            height
        );
    }
    
      private initAttack() {
        const attackKey = this.scene.input.keyboard!.addKey(
            Phaser.Input.Keyboard.KeyCodes.SPACE
        );
    
        attackKey.on("down", () => {
          if (this.scene.isAttacking) return;
      
          this.scene.isAttacking = true;
      
          this.scene.hero.setFlipX(this.scene.facingRight ? false : true);
    
          this.scene.hero.play("attack"+this.scene.userClass, true);
          this.updateHeroFacing();
          const attackHitbox = this.getAttackHitbox();
      
          this.scene.enemies.forEach(enemy => {
              const enemyRect = enemy.getBounds();
      
              if (Phaser.Geom.Rectangle.Overlaps(attackHitbox, enemyRect)) {
                  this.damageEnemy(enemy);
              }
          });
      });
    
        this.scene.hero.on("animationcomplete", (anim: Phaser.Animations.Animation) => {
            if (anim.key === "attack"+this.scene.userClass) {
                this.scene.isAttacking = false;
                const correctDeathKey = this.scene.userClass + "Death";
                this.updateHeroFacing();
                this.scene.hero.setTexture(correctDeathKey, 0);
            }
        });
      }
    
      private updateHeroFacing() {
        if (!this.scene.hero) return;
    
        const isMage = this.scene.userClass.toLowerCase() === "mage";
        const isWalking = this.scene.hero.anims.isPlaying && this.scene.hero.anims.currentAnim?.key.includes("walk");
        
        if(isMage && !isWalking){
          if (this.scene.facingRight) {
            this.scene.hero.setFlipX(true);
          } else {
            this.scene.hero.setFlipX(false);
          }
        } else {
          if (this.scene.facingRight) {
            this.scene.hero.setFlipX(false);
          } else {
            this.scene.hero.setFlipX(true);
          }
        }
    
      }
    
      // Hero damege taken
      public takeDamage(amount: number) {
        if (this.scene.isDead) return;
    
        const hearts = this.scene.data.get("hearts") as Phaser.GameObjects.Image[];
        if (!hearts || amount <= 0) return;
    
        const visibleHearts = hearts
            .map((h, i) => h.visible ? i : -1)
            .filter(i => i !== -1);
    
        const damage = Math.min(amount, visibleHearts.length);
    
        for (let i = 0; i < damage; i++) {
            const index = visibleHearts[visibleHearts.length - 1 - i];
            const heart = hearts[index];
    
            heart.setVisible(false);
            const animHeart = this.scene.add.sprite(
                heart.x + heart.parentContainer!.x,
                heart.y + heart.parentContainer!.y,
                "heart_loss"
            );
    
            animHeart.setScrollFactor(0);
            animHeart.setDepth(200);
            animHeart.setOrigin(0, 0);
            animHeart.setDisplaySize(38, 38);
    
            animHeart.x -= 10;
            animHeart.y -= 10;
    
            animHeart.play("heartLose", true);
    
            animHeart.once("animationcomplete", () => {
                animHeart.destroy();
            });
        }
        const remainingHearts = hearts.filter(h => h.visible).length;
    
        if (remainingHearts === 0 && !this.scene.isDead) {
            this.killHero();
        }
      }
    
      // Hero death
      private killHero() {
        if (this.scene.isDead) return;
        this.scene.isDead = true;
        
        this.scene.stroyManager.logEvent("PLAYER_DEATH", `Fell heroically in battle, succumbing to the dungeon's perils.`, this.scene.user.username);
        if (this.scene.hero.body) {
          (this.scene.hero.body as Phaser.Physics.Arcade.Body).setVelocity(0, 0);
        }
        this.scene.hero.stop();
        
        this.scene.isAttacking = true;
    
    
        this.scene.hero.setTexture(this.scene.userClass+"Death");
        this.scene.hero.play("death" + this.scene.userClass, true);
        fetch("http://localhost:7071/api/update_game_lobby", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                dungeonCode: this.scene.dungeonCode,
                lobbyId: this.scene.lobbyId,
                userId: this.scene.user.uid,
                actionType: "PLAYER_DIED",
                targetId: this.scene.userClass
            })
        }).catch(err => console.error(err));
    
        this.scene.cameras.main.stopFollow();
    
        this.scene.hero.once("animationcomplete", () => {
            const gameOverPanel = new GenericPanel("generic-panel", "panel-content", "overlay");
    
            const originalHide = gameOverPanel.hide.bind(gameOverPanel);
    
            gameOverPanel.hide = () => {};
    
            const gameOverHTML = `
                <div class="gameover-box">
                    <h2 class="gameover-title">SEI MORTO</h2>
                    <p class="gameover-text">Le tenebre del dungeon<br>hanno avuto la meglio su di te.</p>
                    
                    <div class="gameover-buttons">
                        <button id="gameover-revive-btn" class="gameover-btn revive-btn">
                            RIVIVI
                        </button>
                        <button id="gameover-exit-btn" class="gameover-btn">
                            TORNA ALLA LOBBY
                        </button>
                    </div>
                </div>
            `;
    
            gameOverPanel.show(gameOverHTML);
    
            this.scene.time.delayedCall(100, () => {
              const exitBtn = document.getElementById("gameover-exit-btn");
              if (exitBtn) {
                exitBtn.addEventListener("click", () => {
                  window.location.href = "homepage.html";
                })
              }
            });
    
            const reviveBtn = document.getElementById("gameover-revive-btn");
            if (reviveBtn) {
              reviveBtn.addEventListener("click", () => {
                originalHide();
                const overlay = document.getElementById("overlay");
                if (overlay) {
                  overlay.style.display = "none";
                }
    
                this.reviveHero();
              });
            } 
        });
      }
      private reviveHero() {
        const startRoom = this.scene.dungeon.rooms.find(r =>
          r.asset.includes("loginroom")
        );
        if (!startRoom) return;
    
        this.scene.currentRoom = startRoom;
        this.scene.hero.x = startRoom.x + startRoom.width / 2;
        this.scene.hero.y = startRoom.y + startRoom.height / 2;
    
        this.scene.isDead = false;
        this.scene.isAttacking = false;
        this.scene.hero.play("death" + this.scene.userClass, true);
    
        const hearts = this.scene.data.get("hearts") as Phaser.GameObjects.Image[];
        hearts.forEach(h => h.setVisible(true));
    
        this.scene.cameras.main.startFollow(this.scene.hero);
      }
}