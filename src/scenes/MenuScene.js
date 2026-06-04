const CX = 960 / 2;
const CY = 640 / 2;

const TITLE_STYLE = {
  fontFamily: 'monospace',
  fontSize: '64px',
  color: '#e8d5a3',
  stroke: '#3a1a00',
  strokeThickness: 6,
  align: 'center',
};

const SUBTITLE_STYLE = {
  fontFamily: 'monospace',
  fontSize: '20px',
  color: '#8a7a5a',
  align: 'center',
};

const PROMPT_STYLE = {
  fontFamily: 'monospace',
  fontSize: '24px',
  color: '#c0a060',
  align: 'center',
};

export default class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
  }

  create() {
    this.add
      .text(CX, CY - 120, 'CENIZA DE HIERRO', TITLE_STYLE)
      .setOrigin(0.5);

    this.add
      .text(CX, CY - 30, 'Aventura en las ruinas del mundo', SUBTITLE_STYLE)
      .setOrigin(0.5);

    const prompt = this.add
      .text(CX, CY + 80, 'Presiona ENTER para comenzar', PROMPT_STYLE)
      .setOrigin(0.5);

    // Blinking prompt
    this.tweens.add({
      targets: prompt,
      alpha: 0,
      duration: 700,
      ease: 'Linear',
      yoyo: true,
      repeat: -1,
    });

    this.input.keyboard.once('keydown-ENTER', () => {
      this.scene.start('GameScene');
    });
  }
}
