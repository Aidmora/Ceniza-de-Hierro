export default class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload() {
    this.load.spritesheet('player', 'assets/player.png', {
      frameWidth: 128,
      frameHeight: 132,
    });

    this.load.image('floor1', 'assets/map/floor1.png');
    this.load.image('floor2', 'assets/map/floor2.png');
    this.load.image('wall1',  'assets/map/wall1.png');
    this.load.image('wall2',  'assets/map/wall2.png');

    // Núcleo (objetivo) — imagen estática, animada por tween
    this.load.image('nucleo', 'assets/map/nucleo.png');

    // Decoración sin colisión
    this.load.image('rubble', 'assets/map/rubble.png');
    this.load.image('rocks',  'assets/map/rocks.png');
    this.load.image('bush',   'assets/map/bush.png');
    this.load.image('circle', 'assets/map/circle.png');
    this.load.image('column', 'assets/map/column.png');

    // Obstáculos con colisión
    this.load.image('statue', 'assets/map/statue.png');
    this.load.image('pillar', 'assets/map/pillar.png');
    this.load.image('tree',   'assets/map/tree.png');
  }

  create() {
    this.scene.start('MenuScene');
  }
}
