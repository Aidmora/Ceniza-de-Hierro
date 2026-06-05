import { addEmbers } from '../embers.js';

const CX = 480;

const STORY =
  'CENIZA DE HIERRO\n\n' +
  'Vera, última cazadora de su tribu,\n' +
  'desciende a la ciudadela enterrada\n' +
  'que la guerra dejó atrás y la\n' +
  'naturaleza reclamó.\n\n' +
  'En lo profundo late el Núcleo.\n' +
  'Para alcanzarlo debe reunir las\n' +
  'piezas perdidas y cruzar los\n' +
  'antiguos portales.\n\n' +
  'Solo su arco y sus pasos\n' +
  'la guían en la penumbra.';

export default class StoryScene extends Phaser.Scene {
  constructor() {
    super({ key: 'StoryScene' });
  }

  create() {
    this.add.rectangle(0, 0, 960, 640, 0x07050f).setOrigin(0, 0);
    addEmbers(this, 0xaa6644);

    // Panel del texto
    this.add.rectangle(400, 60, 540, 470, 0x140f1e, 0.7).setOrigin(0, 0)
      .setStrokeStyle(2, 0x4a3a55, 0.8);

    // Jugadora en grande (izquierda)
    this.add.sprite(200, 330, 'player', 0).setScale(3);

    // Halo sutil detrás del personaje
    if (!this.textures.exists('story-glow')) {
      const g = this.make.graphics({ add: false });
      for (let i = 0; i <= 10; i++) {
        g.fillStyle(0x6633aa, 0.03 + i * 0.04);
        g.fillCircle(60, 60, 60 - i * 5);
      }
      g.generateTexture('story-glow', 120, 120);
      g.destroy();
    }
    this.add.image(200, 330, 'story-glow')
      .setDisplaySize(240, 240)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setAlpha(0.5);

    // Línea divisoria
    this.add.rectangle(370, 320, 2, 400, 0x443322, 0.6);

    // Texto de historia (derecha)
    this.add.text(410, 110, STORY, {
      fontFamily:  'monospace',
      fontSize:    '15px',
      color:       '#d4c8a0',
      lineSpacing: 7,
    });

    // Botón JUGAR
    const btn = this.add.text(CX + 80, 600, '[ JUGAR ]', {
      fontFamily: 'monospace',
      fontSize:   '24px',
      color:      '#c0a060',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    btn.on('pointerover', () => btn.setColor('#ffd700'));
    btn.on('pointerout',  () => btn.setColor('#c0a060'));
    btn.on('pointerdown', () => this.scene.start('InstructionsScene'));

    this.tweens.add({
      targets: btn, alpha: 0, duration: 700,
      ease: 'Linear', yoyo: true, repeat: -1,
    });

    this.input.keyboard.once('keydown-ENTER', () => this.scene.start('InstructionsScene'));
  }
}
