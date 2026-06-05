import { addEmbers } from '../embers.js';

const CX = 480;
const CY = 320;

const TITLE_STYLE = {
  fontFamily:      'monospace',
  fontSize:        '64px',
  color:           '#e8d5a3',
  stroke:          '#3a1a00',
  strokeThickness: 6,
  align:           'center',
};

const SUBTITLE_STYLE = {
  fontFamily: 'monospace',
  fontSize:   '20px',
  color:      '#8a7a5a',
  align:      'center',
};

const PROMPT_STYLE = {
  fontFamily: 'monospace',
  fontSize:   '24px',
  color:      '#c0a060',
  align:      'center',
};

export default class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
  }

  create() {
    // Reinicia estado al volver al menú (nueva partida)
    this.registry.set('vidas',  3);
    this.registry.set('piezas', 0);

    // Fondo + brasas
    this.add.rectangle(0, 0, 960, 640, 0x0a0710).setOrigin(0, 0);
    addEmbers(this, 0xff8844);

    // Música de fondo: arranca aquí y sigue durante todo el juego (en bucle)
    if (this.cache.audio.exists('bgm') && !this.sound.get('bgm')?.isPlaying) {
      this.sound.play('bgm', { loop: true, volume: 0.4 });
    }

    // Personaje
    this.add.sprite(CX, CY - 10, 'player', 0).setScale(2.4).setDepth(2);

    this.add.text(CX, CY - 150, 'CENIZA DE HIERRO', TITLE_STYLE).setOrigin(0.5).setDepth(2);
    this.add.text(CX, CY - 95, 'Aventura en las ruinas del mundo', SUBTITLE_STYLE).setOrigin(0.5).setDepth(2);

    const prompt = this.add
      .text(CX, CY + 130, 'Presiona ENTER para comenzar', PROMPT_STYLE)
      .setOrigin(0.5).setDepth(2);

    this.tweens.add({
      targets:  prompt,
      alpha:    0,
      duration: 700,
      ease:     'Linear',
      yoyo:     true,
      repeat:   -1,
    });

    this.input.keyboard.once('keydown-ENTER', () => this.scene.start('StoryScene'));
  }
}
