const TILE     = 48;
const MAP_COLS = 30;
const MAP_ROWS = 22;
const MAP_W    = MAP_COLS * TILE;   // 1440 px
const MAP_H    = MAP_ROWS * TILE;   // 1056 px

const SPAWN_COL = 3;   // tile column for player start
const SPAWN_ROW = 3;   // tile row    for player start

const SPEED    = 160;
const SCALE    = 0.45;
const ANIM_FPS = 8;

const IDLE_FRAME = { down: 0, up: 4, left: 8, right: 8 };

const HINT_STYLE = {
  fontFamily: 'monospace',
  fontSize: '16px',
  color: '#555555',
  align: 'center',
};

// 0 = floor · 1 = wall/obstacle
// 30 cols × 22 rows — tile size: TILE × TILE px
const MAP_DATA = [
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1], //  0 — top border
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1], //  1
  [1,0,0,0,0,0,0,0,1,0,0,1,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,1], //  2 — pillar pair
  [1,0,0,0,0,0,0,0,1,0,0,1,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,1], //  3
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1], //  4 — top wall segment
  [1,1,1,1,0,0,0,0,0,0,0,0,0,0,1,0,0,1,0,0,0,0,0,0,0,1,1,0,0,1], //  5 — L-wall + alcove
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,1,0,0,0,0,0,0,0,0,0,0,0,1], //  6
  [1,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,1], //  7 — lone column
  [1,0,0,0,0,0,1,0,0,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1], //  8 — broken room top
  [1,0,0,0,0,0,1,0,0,0,1,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1], //  9
  [1,0,0,0,0,0,0,0,0,0,1,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1], // 10 — broken room open
  [1,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,1], // 11 — scattered rubble
  [1,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,1], // 12
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,1,0,0,1], // 13 — far-right pillar
  [1,0,0,0,0,1,1,1,0,0,0,0,0,0,0,0,1,1,1,1,0,0,0,0,0,0,1,0,0,1], // 14 — two wall segments
  [1,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,1], // 15
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,1], // 16
  [1,0,0,0,0,0,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1], // 17 — collapsed arch
  [1,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,1,1,1,0,0,0,0,1], // 18 — debris cluster
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,1], // 19
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1], // 20 — open bottom lane
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1], // 21 — bottom border
];

export default class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
  }

  create() {
    // ── Map (drawn before player so it renders beneath) ───────────────────────
    this.walls = this._buildMap();

    // ── Physics world & camera bounds ─────────────────────────────────────────
    this.physics.world.setBounds(0, 0, MAP_W, MAP_H);
    this.cameras.main.setBounds(0, 0, MAP_W, MAP_H);

    // ── Vera ──────────────────────────────────────────────────────────────────
    const spawnX = SPAWN_COL * TILE + TILE / 2;
    const spawnY = SPAWN_ROW * TILE + TILE / 2;
    this.vera = this.physics.add.sprite(spawnX, spawnY, 'player', 0);
    this.vera.setScale(SCALE);
    this.vera.setCollideWorldBounds(true);
    // Body box centered on sprite — tune width/height to fit silhouette:
    this.vera.body.setSize(28, 32);

    this.cameras.main.startFollow(this.vera, true, 0.1, 0.1);

    // ── Collisions ────────────────────────────────────────────────────────────
    this.physics.add.collider(this.vera, this.walls);

    // ── Animations ────────────────────────────────────────────────────────────
    const def = (key, start, end) => {
      if (!this.anims.exists(key)) {
        this.anims.create({
          key,
          frames: this.anims.generateFrameNumbers('player', { start, end }),
          frameRate: ANIM_FPS,
          repeat: -1,
        });
      }
    };
    def('walk-down', 0, 3);
    def('walk-up',   4, 7);
    def('side',      8, 10);

    // ── Input ─────────────────────────────────────────────────────────────────
    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd = this.input.keyboard.addKeys({
      up:    Phaser.Input.Keyboard.KeyCodes.W,
      down:  Phaser.Input.Keyboard.KeyCodes.S,
      left:  Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
    });
    this.facing = 'down';

    // ── HUD (screen-fixed) ────────────────────────────────────────────────────
    const sw = this.scale.width;
    const sh = this.scale.height;
    this.add
      .text(sw / 2, sh - 16, '[V] Victoria   [G] Derrota  (teclas de prueba)', HINT_STYLE)
      .setOrigin(0.5, 1)
      .setScrollFactor(0);

    // Temporary test keys — remove once gameplay is implemented
    this.input.keyboard.once('keydown-V', () => this.scene.start('VictoryScene'));
    this.input.keyboard.once('keydown-G', () => this.scene.start('GameOverScene'));
  }

  update() {
    const { vx, vy } = this._velocity();
    this.vera.setVelocity(vx, vy);
    this._animate(vx, vy);
  }

  // ── Private helpers ─────────────────────────────────────────────────────────

  _velocity() {
    const { cursors, wasd } = this;
    let vx = 0;
    let vy = 0;
    if (cursors.left.isDown  || wasd.left.isDown)  vx -= SPEED;
    if (cursors.right.isDown || wasd.right.isDown) vx += SPEED;
    if (cursors.up.isDown    || wasd.up.isDown)    vy -= SPEED;
    if (cursors.down.isDown  || wasd.down.isDown)  vy += SPEED;
    if (vx !== 0 && vy !== 0) {
      const d = SPEED / Math.SQRT2;
      vx = vx > 0 ? d : -d;
      vy = vy > 0 ? d : -d;
    }
    return { vx, vy };
  }

  _animate(vx, vy) {
    const { vera } = this;
    const moving = vx !== 0 || vy !== 0;
    const horizDominant = moving && Math.abs(vx) >= Math.abs(vy);

    if (horizDominant) {
      this.facing = vx > 0 ? 'right' : 'left';
    } else if (moving) {
      this.facing = vy > 0 ? 'down' : 'up';
    }

    vera.setFlipX(this.facing === 'right');

    if (!moving) {
      vera.anims.stop();
      vera.setFrame(IDLE_FRAME[this.facing]);
    } else if (horizDominant) {
      vera.play('side', true);
    } else {
      vera.play(vy > 0 ? 'walk-down' : 'walk-up', true);
    }
  }

  _buildMap() {
    const { add, physics } = this;

    // ── Floor (tiled texture, drawn first) ───────────────────────────────────
    if (!this.textures.exists('floor-tile')) {
      const g = this.make.graphics({ add: false });
      g.fillStyle(0x1e1814);
      g.fillRect(0, 0, TILE, TILE);
      g.fillStyle(0x252018);           // slightly lighter stone face
      g.fillRect(2, 2, TILE - 4, TILE - 4);
      g.fillStyle(0x131008);           // dark mortar joint
      g.fillRect(0, TILE - 1, TILE, 1);
      g.fillRect(TILE - 1, 0, 1, TILE);
      g.generateTexture('floor-tile', TILE, TILE);
      g.destroy();
    }
    add.tileSprite(0, 0, MAP_W, MAP_H, 'floor-tile').setOrigin(0, 0);

    // ── Wall tiles ────────────────────────────────────────────────────────────
    if (!this.textures.exists('wall-tile')) {
      const g = this.make.graphics({ add: false });
      g.fillStyle(0x6a5a48);           // stone base
      g.fillRect(0, 0, TILE, TILE);
      g.fillStyle(0x7e6e5c);           // top-left bevel highlight
      g.fillRect(0, 0, TILE, 3);
      g.fillRect(0, 0, 3, TILE);
      g.fillStyle(0x3a2e20);           // bottom-right bevel shadow
      g.fillRect(0, TILE - 2, TILE, 2);
      g.fillRect(TILE - 2, 0, 2, TILE);
      g.generateTexture('wall-tile', TILE, TILE);
      g.destroy();
    }

    const walls = physics.add.staticGroup();
    for (let row = 0; row < MAP_ROWS; row++) {
      for (let col = 0; col < MAP_COLS; col++) {
        if (MAP_DATA[row][col] === 1) {
          walls.create(col * TILE + TILE / 2, row * TILE + TILE / 2, 'wall-tile');
        }
      }
    }
    return walls;
  }
}
