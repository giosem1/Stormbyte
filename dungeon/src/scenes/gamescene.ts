import Phaser from "phaser";

export class RoomScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;

  constructor() {
    super("RoomScene");
  }

  preload() {
    this.load.image("room_bg", "/assets/loginroom.png");
    this.load.image("player", "/assets/Cavaliere.png");
  }

  create() {
    const bg = this.add.image(400, 300, "room_bg");

    // Player
    this.player = this.physics.add.sprite(400, 300, "player");
    this.player.setScale(0.25);
    this.player.setCollideWorldBounds(true);

    // Controlli
    this.cursors = this.input.keyboard.createCursorKeys();

    // Collider invisibili
    const walls: Phaser.Physics.Arcade.StaticGroup = this.physics.add.staticGroup();

    // Pareti (esempio)
    walls.create(400, 50, "").setDisplaySize(800, 20).refreshBody();  // muro superiore
    walls.create(400, 550, "").setDisplaySize(800, 20).refreshBody(); // muro inferiore
    walls.create(50, 300, "").setDisplaySize(20, 600).refreshBody();  // muro sinistro
    walls.create(750, 300, "").setDisplaySize(20, 600).refreshBody(); // muro destro

    // Tavolo (esempio)
    walls.create(400, 300, "").setDisplaySize(100, 50).refreshBody(); // tavolo centrale

    // Aggiungi collisione player-muri/mobili
    this.physics.add.collider(this.player, walls);
  }

  update() {
    const speed = 150;
    this.player.setVelocity(0);

    if (this.cursors.left?.isDown) {
      this.player.setVelocityX(-speed);
    } else if (this.cursors.right?.isDown) {
      this.player.setVelocityX(speed);
    }

    if (this.cursors.up?.isDown) {
      this.player.setVelocityY(-speed);
    } else if (this.cursors.down?.isDown) {
      this.player.setVelocityY(speed);
    }
  }
}
