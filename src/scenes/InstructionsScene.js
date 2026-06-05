import { addEmbers } from '../embers.js';

const CX = 480;

const ROWS = [
  ['MOVERSE',   'WASD  /  ↑ ↓ ← →'],
  ['DISPARAR',  'J   (flechas)'],
  ['ESQUIVAR',  'ESPACIO   (salto/esquive breve)'],
  ['',          ''],
  ['OBJETIVO',  'Recoge la PIEZA que custodian los'],
  ['',          'dragones: la puerta se ILUMINA y'],
  ['',          'puedes cruzarla a la siguiente zona.'],
  ['',          'En la última, alcanza el PORTAL.'],
  ['',          ''],
  ['ENEMIGOS',  'Dragones guardianes lanzan fuego.'],
  ['',          '2 flechas los derriban.'],
  ['',          ''],
  ['VIDAS',     '3 — si caes, reapareces al inicio.'],
  ['TIEMPO',    '120 s por zona; si se acaba, pierdes.'],
];

export default class InstructionsScene extends Phaser.Scene {
  constructor() {
    super({ key: 'InstructionsScene' });
  }

  create() {
    this.add.rectangle(0, 0, 960, 640, 0x07050f).setOrigin(0, 0);
    addEmbers(this, 0xaa6644);

    // Panel
    this.add.rectangle(90, 88, 780, 470, 0x140f1e, 0.65).setOrigin(0, 0)
      .setStrokeStyle(2, 0x4a3a55, 0.8);

    this.add.text(CX, 44, 'INSTRUCCIONES', {
      fontFamily:      'monospace',
      fontSize:        '34px',
      color:           '#e8d5a3',
      stroke:          '#3a1a00',
      strokeThickness: 4,
    }).setOrigin(0.5);

    // Íconos del juego
    this.add.sprite(800, 150, 'player', 0).setScale(1.4);
    this.add.sprite(800, 250, 'enemy', 9).setScale(0.35);
    this.add.image(800, 340, 'pieza').setDisplaySize(40, 40);

    let y = 105;
    for (const [label, value] of ROWS) {
      if (label === '' && value === '') { y += 6; continue; }
      if (label) {
        this.add.text(140, y, label, {
          fontFamily: 'monospace', fontSize: '16px', color: '#ffd700',
        });
      }
      if (value) {
        this.add.text(320, y, value, {
          fontFamily: 'monospace', fontSize: '16px', color: '#d4c8a0',
        });
      }
      y += 30;
    }

    // Botón EMPEZAR
    const btn = this.add.text(CX, 605, '[ EMPEZAR ]', {
      fontFamily: 'monospace',
      fontSize:   '26px',
      color:      '#c0a060',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    btn.on('pointerover', () => btn.setColor('#ffd700'));
    btn.on('pointerout',  () => btn.setColor('#c0a060'));
    btn.on('pointerdown', () => this.scene.start('GameScene', { level: 0 }));

    this.tweens.add({
      targets: btn, alpha: 0, duration: 700,
      ease: 'Linear', yoyo: true, repeat: -1,
    });

    this.input.keyboard.once('keydown-ENTER', () => this.scene.start('GameScene', { level: 0 }));
  }
}
