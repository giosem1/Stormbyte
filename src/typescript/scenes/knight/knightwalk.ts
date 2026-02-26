export class Knight extends Phaser.Scene
{
    private knight!: Phaser.GameObjects.Sprite;

    constructor ()
    {
        super("Knight");
    }

    preload ()
    {
        this.load.spritesheet("kng", "/assets/KngWlak.png", {
            frameWidth: 81,
            frameHeight: 130
        });
    }

    create ()
    {
        this.anims.create({
            key: "walk",
            frames: this.anims.generateFrameNumbers("kng", { start: 0, end:17 }),
            frameRate: 9,
            repeat: -1
        });

        this.knight = this.add.sprite(400, 300, "kng");
        this.knight.play("walk", true);
        
    }
}
