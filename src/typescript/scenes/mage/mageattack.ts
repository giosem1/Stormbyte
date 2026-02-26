export class Mage extends Phaser.Scene
{
    private mage!: Phaser.GameObjects.Sprite;

    constructor ()
    {
        super("Mage");
    }

    preload ()
    {
        this.load.spritesheet("mge", "assets/MageAnimation/MageAttack.png", {
            frameWidth: 383,
            frameHeight: 321
        });
    }

    create ()
    {
        this.anims.create({
            key: "attack",
            frames: this.anims.generateFrameNumbers("mge", { start: 0, end:35 }),
            frameRate: 10,
            repeat: -1
        });

        this.mage = this.add.sprite(
            this.cameras.main.width / 2,
            this.cameras.main.height / 2,
            "mge"
        );
        this.mage.setDisplaySize(146, 136);
        this.mage.play("attack", true);

    }
}
