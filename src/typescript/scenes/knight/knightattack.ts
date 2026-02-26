export class Knight extends Phaser.Scene
{
    private knight!: Phaser.GameObjects.Sprite;

    constructor ()
    {
        super("Knight");
    }

    preload ()
    {
        this.load.spritesheet("kng", "assets/KnightAnimation/KnightAttack.png", {
            frameWidth: 438,
            frameHeight: 408
        });
    }

    create ()
    {
        this.anims.create({
            key: "attack",
            frames: this.anims.generateFrameNumbers("kng", { start: 0, end:35 }),
            frameRate: 10,
            repeat: -1
        });

        this.knight = this.add.sprite(
            this.cameras.main.width / 2,
            this.cameras.main.height / 2,
            "kng"
        );
        this.knight.setDisplaySize(146, 136);
        this.knight.play("attack", true);

    }
}
