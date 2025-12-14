import Phaser from "phaser";
import { Torch } from "../scenes/torch";

const config = {
  type: Phaser.AUTO,
  width: window.innerWidth,
  height: window.innerHeight,
  transparent: true,
  scene: Torch,
};

new Phaser.Game(config);
