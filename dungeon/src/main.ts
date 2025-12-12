import Phaser from "phaser";
import {RoomScene} from "./scenes/gamescene";

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
    parent: 'phaser-example',
    physics: {
        default: 'arcade',
        arcade: {
            debug: false
        }
    },
  scene: [RoomScene]
};

new Phaser.Game(config);
