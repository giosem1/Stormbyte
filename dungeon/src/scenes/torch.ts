export class Torch extends Phaser.Scene
{
    private torchLeft!: Phaser.GameObjects.Sprite;
    private torchRight!: Phaser.GameObjects.Sprite;
    private page!: string;

    constructor () 
    {
        super("Torch");
    }
    init() {
        const path = window.location.pathname;
        this.page = path.substring(path.lastIndexOf("/") + 1);
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

        const screenWidth = this.scale.width;
        const screenHeight = this.scale.height;

        const positions: Record<string, { boxHalfWidth: number; gap: number, centerX: number, y: number }> = {
            "login.html": { 
                boxHalfWidth: screenWidth * 0.15,
                gap: screenWidth * 0.07,
                centerX: screenWidth / 2,
                y: screenHeight / 2
            },
            "homepage.html": { 
                boxHalfWidth: screenWidth * 0.18,
                gap: screenWidth * 0.05,
                centerX: screenWidth * 0.68,
                y: screenHeight / 4.7
            }
        };

        const { boxHalfWidth, gap, centerX, y} =
            positions[this.page] ?? { boxHalfWidth: 175, gap: 80, centerX: this.scale.width / 2, y: this.scale.height / 2};

        this.torchLeft = this.add.sprite(centerX - boxHalfWidth - gap, y, "sheet");
        this.torchRight = this.add.sprite(centerX + boxHalfWidth + gap, y, "sheet");

        this.torchLeft.play("light", true);
        this.torchRight.play("light", true);

        this.torchLeft.setBlendMode(Phaser.BlendModes.SCREEN);
        this.torchRight.setBlendMode(Phaser.BlendModes.SCREEN);
}

}
