export class Torch extends Phaser.Scene
{
    private torchLeft!: Phaser.GameObjects.Sprite;
    private torchRight!: Phaser.GameObjects.Sprite;

    constructor () 
    {
        super("Torch");
    }

    preload ()
    {
        this.load.spritesheet("sheet", "/assets/torch.png", {
            frameWidth: 106,
            frameHeight: 277
        });
    }

    create ()
{
    this.anims.create({
        key: "light",
        frames: this.anims.generateFrameNumbers("sheet", { frames: [0, 1, 2, 3] }),
        frameRate: 8,
        repeat: -1
    });

    const centerX = window.innerWidth / 2;
    const boxHalfWidth = 175; 
    const gap = 80; 
    const y = window.innerHeight / 2; 
 
    this.torchLeft = this.add.sprite(centerX - boxHalfWidth - gap, y, "sheet");
    this.torchLeft.play("light", true);
    this.torchLeft.setBlendMode(Phaser.BlendModes.SCREEN);

    this.torchRight = this.add.sprite(centerX + boxHalfWidth + gap, y, "sheet");
    this.torchRight.play("light", true);
    this.torchRight.setBlendMode(Phaser.BlendModes.SCREEN);
}

}
