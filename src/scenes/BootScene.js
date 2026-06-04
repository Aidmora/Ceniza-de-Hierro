export default class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload() {
    this.load.spritesheet('player', 'assets/player.png', {
      frameWidth: 128,
      frameHeight: 132,
    });
  }

  create() {
    this.scene.start('MenuScene');
  }
}
