const TILE     = 48;
const MAP_COLS = 30;
const MAP_ROWS = 22;
const MAP_W    = MAP_COLS * TILE;   // 1440 px
const MAP_H    = MAP_ROWS * TILE;   // 1056 px

const SPAWN_COL   = 3;
const SPAWN_ROW   = 3;
const NUCLEUS_COL = 26;
const NUCLEUS_ROW = 18;

const SPEED    = 160;
const SCALE    = 0.45;
const ANIM_FPS = 8;

const IDLE_FRAME = { down: 0, up: 4, left: 8, right: 8 };

// Tint applied to all floor and wall tiles for the dungeon mood.
const FLOOR_TINT = 0x99aabb;
const WALL_TINT  = 0x8899aa;

const HINT_STYLE = {
  fontFamily: 'monospace',
  fontSize: '16px',
  color: '#aaaaaa',
  align: 'center',
};

// 0 = floor · 1 = wall   —   30 cols × 22 rows, TILE 48 px each
const MAP_DATA = [
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1], //  0
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1], //  1
  [1,0,0,0,0,0,0,0,1,0,0,1,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,1], //  2
  [1,0,0,0,0,0,0,0,1,0,0,1,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,1], //  3
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1], //  4
  [1,1,1,1,0,0,0,0,0,0,0,0,0,0,1,0,0,1,0,0,0,0,0,0,0,1,1,0,0,1], //  5
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,1,0,0,0,0,0,0,0,0,0,0,0,1], //  6
  [1,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,1], //  7
  [1,0,0,0,0,0,1,0,0,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1], //  8
  [1,0,0,0,0,0,1,0,0,0,1,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1], //  9
  [1,0,0,0,0,0,0,0,0,0,1,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1], // 10
  [1,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,1], // 11
  [1,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,1], // 12
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,1,0,0,1], // 13
  [1,0,0,0,0,1,1,1,0,0,0,0,0,0,0,0,1,1,1,1,0,0,0,0,0,0,1,0,0,1], // 14
  [1,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,1], // 15
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,1], // 16
  [1,0,0,0,0,0,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1], // 17
  [1,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,1,1,1,0,0,0,0,1], // 18
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,1], // 19
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1], // 20
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1], // 21
];

// Stable per-tile variant: 0 or 1, no floats, no randomness at runtime
const tileVariant = (row, col) => (row * 31 + col * 17) & 1;

// Seeded LCG for deterministic decoration placement
function makeLCG(seed) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0x100000000;
  };
}

export default class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
  }

  create() {
    // ── Map (floor depth 0, walls depth 1) ───────────────────────────────────
    this.walls = this._buildMap();

    // ── World & camera bounds ─────────────────────────────────────────────────
    this.physics.world.setBounds(0, 0, MAP_W, MAP_H);
    this.cameras.main.setBounds(0, 0, MAP_W, MAP_H);

    // ── Decoración (before player so Vera always renders on top) ──────────────
    this._buildDecor(this.walls);

    // ── Núcleo / portal ───────────────────────────────────────────────────────
    this._buildNucleus();

    // ── Vera ──────────────────────────────────────────────────────────────────
    const spawnX = SPAWN_COL * TILE + TILE / 2;
    const spawnY = SPAWN_ROW * TILE + TILE / 2;
    this.vera = this.physics.add.sprite(spawnX, spawnY, 'player', 0);
    this.vera.setScale(SCALE);
    this.vera.setCollideWorldBounds(true);
    this.vera.body.setSize(28, 32);
    this.vera.setDepth(spawnY);

    this.cameras.main.startFollow(this.vera, true, 0.1, 0.1);
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

    // ── HUD (screen-fixed, always on top) ────────────────────────────────────
    const sw = this.scale.width;
    const sh = this.scale.height;
    this.add
      .text(sw / 2, sh - 16, '[V] Victoria   [G] Derrota  (teclas de prueba)', HINT_STYLE)
      .setOrigin(0.5, 1)
      .setScrollFactor(0)
      .setDepth(10000);

    this.input.keyboard.once('keydown-V', () => this.scene.start('VictoryScene'));
    this.input.keyboard.once('keydown-G', () => this.scene.start('GameOverScene'));
  }

  update() {
    const { vx, vy } = this._velocity();
    this.vera.setVelocity(vx, vy);
    this._animate(vx, vy);
    this.vera.setDepth(this.vera.y);
  }

  // ── Private helpers ──────────────────────────────────────────────────────────

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

  // ── Scene builders ────────────────────────────────────────────────────────────

  _buildMap() {
    const walls = this.physics.add.staticGroup();

    for (let row = 0; row < MAP_ROWS; row++) {
      for (let col = 0; col < MAP_COLS; col++) {
        // Pixel centre of the cell, rounded to avoid sub-pixel seams
        const x = Math.round(col * TILE + TILE / 2);
        const y = Math.round(row * TILE + TILE / 2);
        const v = tileVariant(row, col);

        if (MAP_DATA[row][col] === 0) {
          // Floor tile — no physics
          const key = v === 0 ? 'floor1' : 'floor2';
          this.add.image(x, y, key)
            .setDisplaySize(TILE, TILE)
            .setTint(FLOOR_TINT)
            .setDepth(0);
        } else {
          // Wall tile — static physics body
          const key = v === 0 ? 'wall1' : 'wall2';
          const sprite = walls.create(x, y, key);
          sprite.setDisplaySize(TILE, TILE)
                .setTint(WALL_TINT)
                .setDepth(1);
          // Resize the static body to match the display size (StaticBody.reset
          // reads gameObject.displayWidth/Height, so it must come after setDisplaySize).
          sprite.body.reset(x, y);
        }
      }
    }

    return walls;
  }

  _buildNucleus() {
    const nx = Math.round(NUCLEUS_COL * TILE + TILE / 2);
    const ny = Math.round(NUCLEUS_ROW * TILE + TILE);  // origin(0.5,1) → base at tile bottom

    const displayW = 140;
    const displayH = Math.round((112 / 204) * displayW); // ≈ 77 px

    const nucleus = this.add.image(nx, ny, 'nucleo')
      .setOrigin(0.5, 1)
      .setDisplaySize(displayW, displayH)
      .setDepth(ny);

    const baseScaleX = nucleus.scaleX;
    const baseScaleY = nucleus.scaleY;
    this.tweens.add({
      targets: nucleus,
      scaleX: baseScaleX * 1.06,
      scaleY: baseScaleY * 1.06,
      alpha: 0.85,
      duration: 900,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1,
    });
  }

  _eligibleCells() {
    const occupied = new Set();

    for (let r = 0; r < MAP_ROWS; r++) {
      for (let c = 0; c < MAP_COLS; c++) {
        if (MAP_DATA[r][c] !== 0) occupied.add(`${r},${c}`);
      }
    }

    // Exclusion zone: ±2 tiles around spawn and nucleus
    for (let dr = -2; dr <= 2; dr++) {
      for (let dc = -2; dc <= 2; dc++) {
        occupied.add(`${SPAWN_ROW + dr},${SPAWN_COL + dc}`);
        occupied.add(`${NUCLEUS_ROW + dr},${NUCLEUS_COL + dc}`);
      }
    }

    const cells = [];
    for (let r = 1; r < MAP_ROWS - 1; r++) {
      for (let c = 1; c < MAP_COLS - 1; c++) {
        if (!occupied.has(`${r},${c}`)) cells.push({ r, c });
      }
    }
    return cells;
  }

  _placeSprite(key, row, col, depth) {
    const x = Math.round(col * TILE + TILE / 2);
    const y = Math.round(row * TILE + TILE);
    this.add.image(x, y, key).setOrigin(0.5, 1).setDepth(depth);
  }

  _placeTall(key, row, col, walls) {
    const x = Math.round(col * TILE + TILE / 2);
    const y = Math.round(row * TILE + TILE);
    this.add.image(x, y, key).setOrigin(0.5, 1).setDepth(y);

    // Invisible static collision zone at the base of the sprite
    const zone = this.add.zone(x, y - 8, 28, 16);
    this.physics.add.existing(zone, true);
    walls.add(zone);
  }

  _buildDecor(walls) {
    const cells = this._eligibleCells();
    const rng = makeLCG(1234567);

    // Fisher-Yates shuffle for deterministic spread
    for (let i = cells.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [cells[i], cells[j]] = [cells[j], cells[i]];
    }

    let idx = 0;

    // Flat decorations — depth 2, no collision
    const flatDecor = [
      { key: 'rubble', count: 7 },
      { key: 'rocks',  count: 6 },
      { key: 'bush',   count: 5 },
      { key: 'circle', count: 3 },
    ];
    for (const { key, count } of flatDecor) {
      for (let i = 0; i < count && idx < cells.length; i++, idx++) {
        this._placeSprite(key, cells[idx].r, cells[idx].c, 2);
      }
    }

    // Columns — tall, no collision, depth = y (y-sort)
    for (let i = 0; i < 2 && idx < cells.length; i++, idx++) {
      const { r, c } = cells[idx];
      const x = Math.round(c * TILE + TILE / 2);
      const y = Math.round(r * TILE + TILE);
      this.add.image(x, y, 'column').setOrigin(0.5, 1).setDepth(y);
    }

    // Tall obstacles — depth = y (y-sort), small collision zone at base
    const tallDecor = [
      { key: 'statue', count: 2 },
      { key: 'pillar', count: 2 },
      { key: 'tree',   count: 2 },
    ];
    for (const { key, count } of tallDecor) {
      for (let i = 0; i < count && idx < cells.length; i++, idx++) {
        this._placeTall(key, cells[idx].r, cells[idx].c, walls);
      }
    }
  }
}
