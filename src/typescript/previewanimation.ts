import Phaser from "phaser";
import { Knight } from "./scenes/knight/knightattack";
import { Mage } from "./scenes/mage/mageattack";
import { Archer } from "./scenes/archer/archerwalk";
//Preview
type PreviewConfig = {
  id: string;
  scene: typeof Phaser.Scene;
  canvasWidth: number;
  canvasHeight: number;
  imgSrc: string;
  imgAlt: string;
};
export const PREVIEW_CONFIG = {
  knight: {
    id: "knight",
    scene: Knight,
    canvasWidth: 146,
    canvasHeight: 136,
    imgSrc: "/assets/heroes/Cavaliere.png",
    imgAlt: "Cavaliere Blu"
  },
  mage: {
    id: "mage",
    scene: Mage,
    canvasWidth: 146,
    canvasHeight: 136,
    imgSrc: "/assets/heroes/Mago.png",
    imgAlt: "Mago Rosso"
  },
  archer: { 
    id: "archer",
    scene: Archer,
    canvasWidth: 146,
    canvasHeight: 136,
    imgSrc: "/assets/heroes/Aricere.png",
    imgAlt: "Arciere Verde"
  }
} satisfies Record<string, PreviewConfig>;

const activeGames = new Map<HTMLElement, Phaser.Game>();
export function mountPreview(parent: HTMLElement, config: PreviewConfig) {
  if (activeGames.has(parent)) return;

  parent.querySelector("img")?.remove();

  const container = document.createElement("div");
  container.id = `${config.id}-phaser`;
  container.style.position = "relative";
  container.style.width = `${config.canvasWidth}px`;
  container.style.height = `${config.canvasHeight}px`;

  parent.prepend(container);

  const game = new Phaser.Game({
    type: Phaser.AUTO,
    width: config.canvasWidth,
    height: config.canvasHeight,
    parent: container,
    transparent: true,
    scene: config.scene,
    scale: {
      mode: Phaser.Scale.NONE,
      autoCenter: Phaser.Scale.CENTER_BOTH
    }
  });

  activeGames.set(parent, game);
}

export function unmountPreview(parent: HTMLElement, config: PreviewConfig) {
  const game = activeGames.get(parent);
  if (!game) return;

  game.destroy(true);
  activeGames.delete(parent);

  parent.querySelector(`#${config.id}-phaser`)?.remove();

  const img = document.createElement("img");
  img.src = config.imgSrc;
  img.alt = config.imgAlt;
  img.className = "w-full h-auto max-h-[128px]";

  parent.prepend(img);
}
