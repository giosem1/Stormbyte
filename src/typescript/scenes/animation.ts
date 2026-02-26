//KnightAnimation
export function createKnightAnimations(anims: Phaser.Animations.AnimationManager) {
    if (! anims.exists("walkKnight")) {
        anims.create({
            key: "walkKnight",
            frames: anims.generateFrameNumbers("kng", { start: 0, end: 35 }),
            frameRate: 9,
            repeat: -1
        });
    }
    if (!anims.exists("attackKnight")) {
      console.log("active attack")
        anims.create({
            key: "attackKnight",
            frames: anims.generateFrameNumbers("kngAttack", { start: 0, end: 35 }),
            frameRate: 16,
            repeat: 0
        });
    }
    if (!anims.exists("deathKnight")) {
        anims.create({
            key: "deathKnight",
            frames: anims.generateFrameNumbers("KnightDeath", { start: 0, end: 35 }),
            frameRate: 10,
            repeat: 0
        });
    }
}
//MageAnimation
export function createMageAnimations(anims: Phaser.Animations.AnimationManager) {
    if (! anims.exists("walkMage")) {
        anims.create({
            key: "walkMage",
            frames: anims.generateFrameNumbers("mg", { start: 0, end: 35 }),
            frameRate: 9,
            repeat: -1
        });
    }
    if (!anims.exists("attackMage")) {
      console.log("active attack")
        anims.create({
            key: "attackMage",
            frames: anims.generateFrameNumbers("mgAttack", { start: 0, end: 35 }),
            frameRate: 16,
            repeat: 0
        });
    }
    if (!anims.exists("deathMage")) {
        anims.create({
            key: "deathMage",
            frames: anims.generateFrameNumbers("MageDeath", { start: 0, end: 35 }),
            frameRate: 10,
            repeat: 0
        });
    }
}

//ArcherAnimation
export function createArcherAnimations(anims: Phaser.Animations.AnimationManager) {
    if (! anims.exists("walkArcher")) {
        anims.create({
            key: "walkArcher",
            frames: anims.generateFrameNumbers("arc", { start: 0, end: 35 }),
            frameRate: 9,
            repeat: -1
        });
    }
    if (!anims.exists("attackArcher")) {
      console.log("active attack")
        anims.create({
            key: "attackArcher",
            frames: anims.generateFrameNumbers("arcAttack", { start: 0, end: 35 }),
            frameRate: 16,
            repeat: 0
        });
    }
    if (!anims.exists("deathArcher")) {
        anims.create({
            key: "deathArcher",
            frames: anims.generateFrameNumbers("ArcherDeath", { start: 0, end: 17 }),
            frameRate: 10,
            repeat: 0
        });
    }
}

//TrapAnimation
export function trapAnimation(anims: Phaser.Animations.AnimationManager) {
     if (!anims.exists("spikeActivate")) {
      anims.create({
        key: "spikeActivate",
        frames: anims.generateFrameNumbers("spk", { start: 0, end: 13 }),
        frameRate: 16,
        repeat: 0
      });
    }

    if (!anims.exists("fireActivate")) {
      anims.create({
        key: "fireActivate",
        frames: anims.generateFrameNumbers("fir", { start: 0, end: 13 }),
        frameRate: 5,
        repeat: 0
      });
    }

    if (!anims.exists("beartActivate")) {
      anims.create({
        key: "beartActivate",
        frames: anims.generateFrameNumbers("brt", { start: 0, end: 3}),
        frameRate: 5,
        repeat: 0
      });
    }
}

//EnemyAnimation
export function createEnemyAnimations(anims: Phaser.Animations.AnimationManager) {
    if (!anims.exists("enemy_idle")) {
      anims.create({
        key: "enemy_idle",
        frames: anims.generateFrameNumbers("enemy_idle", { start: 0, end: 7 }),
        frameRate: 6,
        repeat: -1
      });
    }

    if (!anims.exists("enemy_alert")) {
      anims.create({
        key: "enemy_alert",
        frames: anims.generateFrameNumbers("enemy_alert", { start: 0, end: 7 }),
        frameRate: 8,
        repeat: -1
      });
    }

    if (!anims.exists("enemy_attack")) {
      anims.create({
        key: "enemy_attack",
        frames: anims.generateFrameNumbers("enemy_attack", { start: 0, end: 7 }),
        frameRate: 12,
        repeat: -1
      });
    }
}

//HeartAnimation
export function createHeartAnimations(anims: Phaser.Animations.AnimationManager) {
    if (!anims.exists("heartLose")) {
        anims.create({
            key: "heartLose",
            frames: anims.generateFrameNumbers("heart_loss", {
                start: 0,
                end: 15
            }),
            frameRate: 12,
            repeat: 0
        });
    }
}
