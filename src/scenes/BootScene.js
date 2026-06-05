export default class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload() {
    this.load.spritesheet('player', 'assets/player.png', {
      frameWidth: 128,
      frameHeight: 132,
    });
    this.load.spritesheet('enemy', 'assets/enemy.png', {
      frameWidth: 194,
      frameHeight: 194,
    });
    this.load.image('pieza',  'assets/pieza.png');
    this.load.image('nucleo', 'assets/map/nucleo.png');

    this.load.image('ts-grass2',      'assets/tilesets/Grass 2 layer.png');
    this.load.image('ts-grass',       'assets/tilesets/Grass.png');
    this.load.image('ts-plants',      'assets/tilesets/Plants.png');
    this.load.image('ts-plantshadow', 'assets/tilesets/PlantShadow.png');
    this.load.image('ts-portal',      'assets/tilesets/portal-Sheet.png');
    this.load.image('ts-props',       'assets/tilesets/Props.png');
    this.load.image('ts-wall',        'assets/tilesets/Wall.png');

    this.load.tilemapTiledJSON('mapa1', 'assets/maps/mapa1.json');
    this.load.tilemapTiledJSON('mapa2', 'assets/maps/mapa2.json');
    this.load.tilemapTiledJSON('mapa3', 'assets/maps/mapa3.json');

    // Audio
    this.load.audio('bgm',          'assets/audio/fondo.mp3');
    this.load.audio('sfx-shot',     'assets/audio/flecha.mp3');
    this.load.audio('sfx-fireball', 'assets/audio/dragon.mp3');
    this.load.audio('sfx-piece',    'assets/audio/piezas.mp3');
    this.load.audio('sfx-walk',     'assets/audio/caminar.mp3');
    this.load.audio('sfx-portal',   'assets/audio/portal.mp3');
    this.load.audio('sfx-victory',  'assets/audio/victoria.mp3');
  }

  create() {
    this.registry.set('vidas',  3);
    this.registry.set('piezas', 0);
    this.scene.start('MenuScene');
  }
}
