import Phaser from "phaser";
import GameScene from "./scenes/gamescene";

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: window.innerWidth,
  height: window.innerHeight,
  backgroundColor: "#000000",
  parent: "game-root",
  physics:{
    default: "arcade",
    arcade: {
      debug: true
    }
  },
  scene: [GameScene]
};

new Phaser.Game(config);
