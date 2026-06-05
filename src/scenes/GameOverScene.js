import { addEmbers } from '../embers.js';

const CX = 480;
const CY = 320;

const TITLE_STYLE = {
  fontFamily:      'monospace',
  fontSize:        '72px',
  color:           '#cc2200',
  stroke:          '#330000',
  strokeThickness: 6,
  align:           'center',
};

const PROMPT_STYLE = {
  fontFamily: 'monospace',
  fontSize:   '24px',
  color:      '#c07070',
  align:      'center',
};

export default class GameOverScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameOverScene' });
  }

  create() {
    // Reinicia el estado para la reintentada
    this.registry.set('vidas',  3);
    this.registry.set('piezas', 0);

    this.add.rectangle(0, 0, 960, 640, 0x0a0508).setOrigin(0, 0);
    addEmbers(this, 0xcc3322);

    this.add.text(CX, CY - 60, 'HAS CAÍDO', TITLE_STYLE).setOrigin(0.5).setDepth(2);

    const prompt = this.add
      .text(CX, CY + 60, '[ REINTENTAR ] — Presiona ESPACIO', PROMPT_STYLE)
      .setOrigin(0.5).setDepth(2);

    this.tweens.add({
      targets:  prompt,
      alpha:    0,
      duration: 700,
      ease:     'Linear',
      yoyo:     true,
      repeat:   -1,
    });

    this.input.keyboard.once('keydown-SPACE', () => {
      this.scene.start('GameScene', { level: 0 });
    });
  }
}
