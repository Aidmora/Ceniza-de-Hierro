import { addEmbers } from '../embers.js';

const CX = 480;
const CY = 320;

const TITLE_STYLE = {
  fontFamily:      'monospace',
  fontSize:        '72px',
  color:           '#ffd700',
  stroke:          '#7a5a00',
  strokeThickness: 6,
  align:           'center',
};

const BODY_STYLE = {
  fontFamily: 'monospace',
  fontSize:   '22px',
  color:      '#e8d5a3',
  align:      'center',
};

const PROMPT_STYLE = {
  fontFamily: 'monospace',
  fontSize:   '22px',
  color:      '#c0a060',
  align:      'center',
};

export default class VictoryScene extends Phaser.Scene {
  constructor() {
    super({ key: 'VictoryScene' });
  }

  create() {
    this.add.rectangle(0, 0, 960, 640, 0x07050f).setOrigin(0, 0);
    addEmbers(this, 0xffcc44);

    // Música: termina el fondo y suena la victoria
    this.sound.stopByKey?.('bgm');
    this.sound.get('bgm')?.stop();
    if (this.cache.audio.exists('sfx-victory')) {
      this.sound.play('sfx-victory', { volume: 0.7 });
    }

    this.add.image(CX, CY - 200, 'pieza').setDisplaySize(56, 56).setDepth(2);
    this.add.text(CX, CY - 120, '¡VICTORIA!', TITLE_STYLE).setOrigin(0.5).setDepth(2);

    const piezas = this.registry.get('piezas') ?? 0;
    this.add.text(CX, CY - 20,
      `Piezas recogidas: ${piezas} / 2\n\nEl Núcleo ha sido alcanzado.\nLa ciudadela descansa.`,
      BODY_STYLE
    ).setOrigin(0.5);

    const prompt = this.add
      .text(CX, CY + 130, 'Presiona ESPACIO para volver al menú', PROMPT_STYLE)
      .setOrigin(0.5);

    this.tweens.add({
      targets:  prompt,
      alpha:    0,
      duration: 700,
      ease:     'Linear',
      yoyo:     true,
      repeat:   -1,
    });

    this.input.keyboard.once('keydown-SPACE', () => this.scene.start('MenuScene'));
  }
}
