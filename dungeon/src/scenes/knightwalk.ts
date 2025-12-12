export class Knight extends Phaser.Scene
{
    private knight!: Phaser.GameObjects.Sprite;

    constructor ()
    {
        super("Knight");
    }

    preload ()
    {
        this.load.spritesheet("kng", "/assets/Knight.png", {
            frameWidth: 64,
            frameHeight: 250
        });
    }

    create ()
    {
        // --- Animazione idle corretta ---
        this.anims.create({
            key: "ide",
            frames: this.anims.generateFrameNumbers("sheet", { frames: [0, 1, 2, 3, 4, 5, 6, 7] }),
            frameRate: 50,
            repeat: -1
        });

        // --- Cavaliere ---
        this.knight = this.add.sprite(200, 536, "kng");
        this.knight.setOrigin(0.5, 1);
        this.knight.setScale(4);
        this.knight.play("idle");

        // --- Movimento verso destra ---
        this.tweens.add({
            targets: this.knight,
            x: "+=300",       // si muove 300px a destra
            duration: 4000,   // in 4 secondi
            yoyo: false,
            repeat: -1        // loop infinito
        });
    }
}
