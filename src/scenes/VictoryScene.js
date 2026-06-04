const CX = 960 / 2;
const CY = 640 / 2;

const TITLE_STYLE = {
  fontFamily: 'monospace',
  fontSize: '72px',
  color: '#ffd700',
  stroke: '#7a5a00',
  strokeThickness: 6,
  align: 'center',
};

const PROMPT_STYLE = {
  fontFamily: 'monospace',
  fontSize: '24px',
  color: '#c0a060',
  align: 'center',
};

export default class VictoryScene extends Phaser.Scene {
  constructor() {
    super({ key: 'VictoryScene' });
  }

  create() {
    this.add
      .text(CX, CY - 60, '¡VICTORIA!', TITLE_STYLE)
      .setOrigin(0.5);

    const prompt = this.add
      .text(CX, CY + 60, 'Presiona ESPACIO para volver al menú', PROMPT_STYLE)
      .setOrigin(0.5);

    this.tweens.add({
      targets: prompt,
      alpha: 0,
      duration: 700,
      ease: 'Linear',
      yoyo: true,
      repeat: -1,
    });

    this.input.keyboard.once('keydown-SPACE', () => {
      this.scene.start('MenuScene');
    });
  }
}
