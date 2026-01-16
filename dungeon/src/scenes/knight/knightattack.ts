import Phaser from "phaser";
export class KnightAttack extends Phaser.Scene
{
    private knight!: Phaser.GameObjects.Sprite;

    constructor ()
    {
        super("KnightAttack");
    }

    preload ()
    {
        this.load.spritesheet("kng", "/assets/Knight_attack.png", {
            frameWidth: 155,
            frameHeight: 158
        });
    }
    
    create ()
    {
        this.anims.create({
            key: "walk",
            frames: this.anims.generateFrameNumbers("kng", { start: 0, end: 5}),
            frameRate: 3,
            repeat: -1
        });

        this.knight = this.add.sprite(400, 300, "kng");
        this.knight.play("walk", true);

        
    }
}
