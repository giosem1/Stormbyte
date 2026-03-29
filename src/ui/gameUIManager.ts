import Phaser from "phaser";
import GenericPanel from "./pannel";
import GameScene from "../typescript/scenes/gamescene";

export class GameUIManager {
    private scene: GameScene;

    constructor(scene: GameScene){
        this.scene = scene;
    }

    public checkWinCondition() {
    if (this.scene.isGameWon) return;

    const activeEnemies = this.scene.enemies.filter(e => e && e.active);
    const activeItems = this.scene.itemsInScene.filter(i => i && i.active);

    if (activeEnemies.length === 0 && activeItems.length === 0){
      this.triggerWin(); 
    }
  }

  public async triggerWin() {
    this.scene.isGameWon = true;
    if (this.scene.hero && this.scene.hero.active){
      this.scene.hero.stop();
      this.scene.hero.play("death" + this.scene.userClass, true);
    }

    const winPanel = new GenericPanel("generic-panel", "panel-content", "overlay");
    winPanel.hide = () => {

    };

    const winHtml = `
        <div class="victory-box-container">
            <div class="victory-title-bar">
                <span class="skull-icon">☠️</span>
                <h2 class="victory-title">DUNGEON CLEARED!</h2>
                <span class="skull-icon">☠️</span>
            </div>
            
            <div class="victory-content">
                <p class="victory-text">You defeated all enemies<br>and collected all items.</p>
                
                <div class="scroll-container">
                    <div class="scroll-top"></div>
                    <div id="story-container" class="scroll-parchment">
                        <p class="bard-text">
                            <span class="loading-bard">📜 The bard is writing the chronicle of your deeds... please wait.</span>
                        </p>
                    </div>
                    <div class="scroll-bottom"></div>
                </div>

                <div class="btn-container">
                    <button id="back-to-lobby-btn" class="forge-btn">
                        <span class="btn-icon">⚔️</span>
                        <span class="btn-text">BACK TO LOBBY</span>
                    </button>
                </div>
            </div>
        </div>
    `;
    winPanel.show(winHtml);

    this.scene.time.delayedCall(100, () => {
      const extitBtn = document.getElementById("back-to-lobby-btn");
      if (extitBtn) {
        extitBtn.addEventListener("click", () => {
          window.location.href = "homepage.html";
        });
      }
    });

    this.scene.stroyManager.logEvent("DUNGEON_CLEARED", `Triumphed over the dungeon, cleansing it of its darkness.`);
    const promptData = this.scene.stroyManager.generateChroniclePrompt();

    try {
      const response = await fetch("http://localhost:7071/api/generate_story", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: promptData,
          dungeonCode: this.scene.dungeonCode
        })
      });

      const storyElement = document.querySelector(".bard-text");

      if (response.ok) {
        const data = await response.json();
        if (storyElement) {
          storyElement.innerHTML = data.story.replace(/\n/g, "<br>");
        }
      } else {
        throw new Error("Error from OpenAI");
      }
      
    }catch(err){
      const storyElement = document.querySelector(".bard-text");
      if (storyElement) {
        storyElement.innerHTML = "The chronicles of this epic battle have been lost in the mists of time...";
      }
    }
  }

  
  public createUI() {
      const { width, height } = this.scene.scale;
  
      // Heart Container
      const maxHealth = 10;
      const heartSpacing = 4; 
      const heartSize = 32; 
  
      this.scene.load.once("complete", () => {
          const healthContainer = this.scene.add.container(width / 2, 50);
          healthContainer.setScrollFactor(0);
          healthContainer.setDepth(100);
  
          const hearts: Phaser.GameObjects.Image[] = [];
  
          for (let i = 0; i < maxHealth; i++) {
              const heart = this.scene.add.image(-((maxHealth - 1) * (heartSize + heartSpacing)) / 2 + i * (heartSize + heartSpacing), 0, "heart");
              heart.setOrigin(0, 0);
              heart.setDisplaySize(heartSize, heartSize);
              healthContainer.add(heart);
              hearts.push(heart);
          }
  
          if (this.scene.dungeon && this.scene.dungeon.name) {
              const dungeonNameText = this.scene.add.text(0, -heartSize, this.scene.dungeon.name, {
                  fontFamily: '"Press Start 2P"',
                  fontSize: '20px',
                  color: '#ffffff'
              }).setOrigin(0.40, 0);
              healthContainer.add(dungeonNameText);
          }
  
          this.scene.data.set("hearts", hearts);
          this.scene.data.set("maxHealth", maxHealth);
      });
  
      // Inventory Container
      const slotSize = 64;
      const padding = 10;
  
      this.scene.inventoryPanel = this.scene.add.container(width / 2, height / 2).setDepth(150);
      this.scene.inventoryPanel.setScrollFactor(0);
      this.scene.inventoryPanel.setVisible(false);
  
      this.scene.inventorySlots = [];
      for (let row = 0; row < 3; row++) {
          for (let col = 0; col < 3; col++) {
              const x = -slotSize - padding + col * (slotSize + padding);
              const y = -slotSize - padding + row * (slotSize + padding);
  
              const slotBg = this.scene.add.rectangle(x, y, slotSize, slotSize, 0x7b5e57);
              slotBg.setStrokeStyle(2, 0x000000);
              this.scene.inventoryPanel.add(slotBg);
  
              const slotItem = this.scene.add.image(x, y, "");
              slotItem.setOrigin(0.5, 0.5);
              slotItem.setVisible(false);
              slotItem.setData("filled", false);
              this.scene.inventoryPanel.add(slotItem);
  
              this.scene.inventorySlots.push(slotItem);
          }
      }
      this.scene.load.start();
    } 
  
  public InteractiveUI() {
    const { width, height } = this.scene.scale;
    const bg = this.scene.add.tileSprite(0, 0, width, height, "bg-stone");

    bg.setOrigin(0);
    bg.setScrollFactor(0);
    bg.setDepth(-100);
    bg.setAlpha(0.25);

    const bagIcon = this.scene.add.image(width - 50, 50, "bag");
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

        const slot = this.scene.inventorySlots[i];
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

    const exitButton = this.scene.add.text(50, 50, "<-", { fontFamily: '"Press Start 2P"', fontSize: '30px', color: '#ffffff'});
    exitButton.setOrigin(0.5, 0.5);
    exitButton.setScrollFactor(0);
    exitButton.setDepth(100);
    exitButton.setInteractive();
    exitButton.on("pointerdown", async () => {
      exitButton.disableInteractive();
      try {
        await fetch("http://localhost:7071/api/leave_game", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: this.scene.user.uid,
            lobbyId: this.scene.lobbyId
          })
        });
      }catch(err) {
        console.error("Error during the exit: ", err);
      } finally{
        window.location.href = 'homepage.html';
      }
    });
    exitButton.on("pointerover", () => {
      exitButton.setColor("#facc15");
      exitButton.setFontSize(40)
    });
    exitButton.on("pointerout", () => {
      exitButton.setColor("#ffffff");
      exitButton.setFontSize(30)
    });

    const inviteText = this.scene.add.text(exitButton.x + 30, exitButton.y + 40, "Invite", {
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
      const friendsList = this.scene.user.friends
      const friendsHTML = friendsList.map(friend => `
          <div class="friend-row flex items-center justify-between border rounded-lg p-3">
              <div class="flex items-center">
                  <img src="${friend.profImg}" alt="Avatar" class="w-12 h-12 rounded-full object-cover mr-4"/>
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
                    toUserId: friendToInvite.uid,
                    fromUserId: this.scene.user.uid,
                    fromUsername: this.scene.user.username,
                    dungeonCode: this.scene.dungeonCode,
                    dungeonName: this.scene.dungeon.name,
                    lobbyId: this.scene.lobbyId
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
  }
}