export class Archer extends Phaser.Scene
{
    private archer!: Phaser.GameObjects.Sprite;

    constructor ()
    {
        super("archer");
    }

    preload ()
    {
        this.load.spritesheet("arc", "assets/ArcherAnimation/ArcherWalk.png", {
            frameWidth: 254,
            frameHeight: 264
        });
    }

    create ()
    {
        this.anims.create({
            key: "walk",
            frames: this.anims.generateFrameNumbers("arc", { start: 0, end:35 }),
            frameRate: 10,
            repeat: -1
        });

        this.archer = this.add.sprite(
            this.cameras.main.width / 2,
            this.cameras.main.height / 2,
            "arc"
        );
        this.archer.setDisplaySize(146, 136);
        this.archer.play("walk", true);

    }
}
