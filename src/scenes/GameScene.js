// ─── Constantes ───────────────────────────────────────────────────────────────
const LEVELS = ['mapa1', 'mapa2', 'mapa3'];

const SPEED         = 120;
const SCALE         = 0.3;
const ENEMY_SCALE   = 0.4;
const ANIM_FPS      = 8;
const ENEMY_FPS     = 6;
const IDLE_FRAME    = { down: 0, up: 4, left: 8, right: 8 };

const SHOOT_CD      = 350;   // ms entre disparos
const DODGE_DUR     = 400;   // ms de invulnerabilidad al esquivar
const DODGE_CD      = 900;   // ms de recarga del esquive
const HIT_IVULN     = 1000;  // ms de invulnerabilidad tras recibir daño

const ENEMY_DETECT  = 260;   // px: rango de detección del dragón
const ENEMY_ATK_RNG = 320;   // px: rango de ataque
const ENEMY_ATK_CD  = 2400;  // ms entre bolas de fuego
const ENEMY_SPEED   = 60;
const ENEMY_HP      = 2;

const FIREBALL_SPD  = 180;
const ARROW_SPD     = 300;
const LEVEL_TIME    = 120;   // segundos por nivel

const HUD_DEPTH     = 10000;

// ─── Escena principal ─────────────────────────────────────────────────────────
export default class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
  }

  init(data) {
    this.levelIndex = (data && data.level != null) ? data.level : 0;
  }

  create() {
    const mapKey = LEVELS[this.levelIndex];
    this.transitioning  = false;
    this.muerto         = false;
    this.pieceCollected = false;
    this.exitActive     = false;
    this.exitPos        = null;
    this.exitIndicator  = null;
    this.facing         = 'down';
    this.invulnerable   = false;
    this.dodging        = false;
    this.knockback      = false;
    this.lastShot       = 0;
    this.lastDodge      = 0;
    this.showShootFrame = false;
    this.timeLeft       = LEVEL_TIME;
    this._lastSecs      = LEVEL_TIME;

    this.cameras.main.fadeIn(400, 0, 0, 0);

    // ── Texturas generadas ───────────────────────────────────────────────────
    this._createTextures();

    // ── Tilemap ──────────────────────────────────────────────────────────────
    const map = this.make.tilemap({ key: mapKey });
    const tilesets = [
      map.addTilesetImage('Grass 2 layer', 'ts-grass2'),
      map.addTilesetImage('Grass',         'ts-grass'),
      map.addTilesetImage('Plants',        'ts-plants'),
      map.addTilesetImage('PlantShadow',   'ts-plantshadow'),
      map.addTilesetImage('portal-Sheet',  'ts-portal'),
      map.addTilesetImage('Props',         'ts-props'),
      map.addTilesetImage('Wall',          'ts-wall'),
    ].filter(Boolean);

    let layerDepth = 0;
    for (const ld of map.layers) {
      map.createLayer(ld.name, tilesets, 0, 0).setDepth(layerDepth++);
    }

    // ── Colisiones (solo desde la capa de objetos 'colisiones') ─────────────
    this.muros = this.physics.add.staticGroup();
    const colLayer = map.getObjectLayer('colisiones');
    if (colLayer) {
      colLayer.objects.forEach(o => {
        const r = this.add.rectangle(o.x + o.width / 2, o.y + o.height / 2, o.width, o.height);
        this.physics.add.existing(r, true);
        r.visible = false;
        this.muros.add(r);
      });
    }

    // ── Leer marcadores ──────────────────────────────────────────────────────
    let startX = map.widthInPixels / 2;
    let startY = map.heightInPixels / 2;
    let portalPos = null;
    const enemyPositions = [];
    let piecePos = null;

    const markerLayer = map.getObjectLayer('marcadores');
    if (markerLayer) {
      for (const obj of markerLayer.objects) {
        switch (obj.name) {
          case 'start':  startX = obj.x; startY = obj.y; break;
          case 'portal': portalPos = { x: obj.x, y: obj.y }; break;
          case 'exit':   this.exitPos = { x: obj.x, y: obj.y }; break;
          case 'piece':  piecePos = { x: obj.x, y: obj.y }; break;
          case 'enemy':  enemyPositions.push({ x: obj.x, y: obj.y }); break;
        }
      }
    }

    // ── Límites mundo / cámara ───────────────────────────────────────────────
    this.physics.world.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);

    // ── Grupos de física ─────────────────────────────────────────────────────
    this.enemies   = this.physics.add.group();
    this.arrows    = this.physics.add.group();
    this.fireballs = this.physics.add.group();

    // ── Portal (mapa3) ───────────────────────────────────────────────────────
    if (portalPos) {
      this._buildNucleus(portalPos.x, portalPos.y);
    }

    // ── Puerta de salida (mapa1, mapa2) ──────────────────────────────────────
    if (this.exitPos) {
      this._buildExit(this.exitPos.x, this.exitPos.y);
    }

    // ── Pieza coleccionable ──────────────────────────────────────────────────
    if (piecePos) {
      this._buildPiece(piecePos.x, piecePos.y);
    }

    // ── Animaciones (antes de spawnear enemigos que llaman a play) ───────────
    this._createAnims();

    // ── Enemigos ─────────────────────────────────────────────────────────────
    for (const pos of enemyPositions) {
      this._spawnEnemy(pos.x, pos.y);
    }

    // ── Jugador (Vera) ───────────────────────────────────────────────────────
    this.startX = startX; this.startY = startY;
    this.vera = this.physics.add.sprite(startX, startY, 'player', 0);
    this.vera.setScale(SCALE).setCollideWorldBounds(true);
    this.vera.body.setSize(10, 16);
    this.vera.setDepth(8);

    // ── Cámara ───────────────────────────────────────────────────────────────
    this.cameras.main.startFollow(this.vera, true, 0.1, 0.1);

    // ── Colisiones y overlaps ────────────────────────────────────────────────
    this.physics.add.collider(this.vera,      this.muros);
    this.physics.add.collider(this.enemies,   this.muros);
    this.physics.add.collider(this.arrows,    this.muros, (arrow) => arrow.destroy());
    this.physics.add.collider(this.fireballs, this.muros, (fb)    => fb.destroy());

    this.physics.add.overlap(this.fireballs, this.vera, (a, b) => {
      const fb = (a === this.vera) ? b : a;   // destruir SIEMPRE la bola, nunca a Vera
      if (fb && fb.destroy) fb.destroy();
      this.recibirDanio();
    });
    this.physics.add.overlap(this.vera, this.enemies, (vera, enemy) => this.recibirDanio(enemy.x, enemy.y));
    this.physics.add.overlap(this.arrows, this.enemies, (arrow, enemy) => {
      arrow.destroy();
      this._hitEnemy(enemy);
    });

    // Trigger portal (mapa3)
    if (portalPos) {
      this._setupPortalTrigger(portalPos.x, portalPos.y);
    }

    // Overlaps pieza y puerta (requieren this.vera — se registran aquí)
    if (this.pieceZone) {
      this.physics.add.overlap(this.vera, this.pieceZone, () => this._collectPiece());
    }
    if (this.exitZone) {
      this.physics.add.overlap(this.vera, this.exitZone, () => {
        if (!this.exitActive || this.transitioning) return;
        this.transitioning = true;
        if (this.walkSnd?.isPlaying) this.walkSnd.stop();
        this._sfx('sfx-portal');
        this.cameras.main.fadeOut(500, 0, 0, 0);
        this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
          this.scene.restart({ level: this.levelIndex + 1 });
        });
      });
    }

    // ── Input ────────────────────────────────────────────────────────────────
    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd = this.input.keyboard.addKeys({
      up:    Phaser.Input.Keyboard.KeyCodes.W,
      down:  Phaser.Input.Keyboard.KeyCodes.S,
      left:  Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
    });
    this.keyJ     = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.J);
    this.keySpace = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    // ── HUD ──────────────────────────────────────────────────────────────────
    this._buildHUD();

    // ── BGM ──────────────────────────────────────────────────────────────────
    if (this.cache.audio.exists('bgm') && !this.sound.get('bgm')?.isPlaying) {
      this.sound.play('bgm', { loop: true, volume: 0.35 });
    }

    // Sonido de pasos (en bucle mientras camina)
    this.walkSnd = this.cache.audio.exists('sfx-walk')
      ? this.sound.add('sfx-walk', { loop: true, volume: 0.35 })
      : null;
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      if (this.walkSnd) { this.walkSnd.stop(); this.walkSnd.destroy(); this.walkSnd = null; }
    });
  }

  // ─── Update ───────────────────────────────────────────────────────────────

  update(time, delta) {
    if (this.muerto || this.transitioning || !this.vera?.body) return;

    // Seguridad: Vera nunca debe quedar oculta
    if (!this.vera.visible) this.vera.setVisible(true);

    this._updateTimer(delta);

    if (!this.knockback) {
      const { vx, vy } = this._velocity();
      this.vera.setVelocity(vx, vy);
      this._animate(vx, vy);

      const moving = (vx !== 0 || vy !== 0);
      if (this.walkSnd) {
        if (moving && !this.walkSnd.isPlaying)       this.walkSnd.play();
        else if (!moving && this.walkSnd.isPlaying)  this.walkSnd.stop();
      }
    }

    if (this.keyJ.isDown)                              this._shootArrow(time);
    if (Phaser.Input.Keyboard.JustDown(this.keySpace)) this._dodge(time);

    this._updateEnemies(time);
    this._cleanupProjectiles();
  }

  // ─── Movimiento / animación del jugador ──────────────────────────────────

  _velocity() {
    const { cursors, wasd } = this;
    let vx = 0, vy = 0;
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
    if (this.showShootFrame) return;
    const { vera } = this;
    const moving        = vx !== 0 || vy !== 0;
    const horizDominant = moving && Math.abs(vx) >= Math.abs(vy);

    if (horizDominant)  this.facing = vx > 0 ? 'right' : 'left';
    else if (moving)    this.facing = vy > 0 ? 'down'  : 'up';

    if (!moving) {
      vera.anims.stop();
      vera.setFrame(IDLE_FRAME[this.facing]);
      vera.setFlipX(this.facing === 'right');
    } else if (horizDominant) {
      vera.setFlipX(vx > 0);
      vera.play('walk-left', true);
    } else {
      vera.setFlipX(false);
      vera.play(vy > 0 ? 'walk-down' : 'walk-up', true);
    }
  }

  // ─── Disparo ─────────────────────────────────────────────────────────────

  _shootArrow(time) {
    if (time - this.lastShot < SHOOT_CD) return;
    this.lastShot = time;

    // Frame de disparo (frame 15)
    this.showShootFrame = true;
    this.vera.anims.stop();
    this.vera.setFrame(15);
    this.time.delayedCall(140, () => { this.showShootFrame = false; });

    const arrow = this.arrows.create(this.vera.x, this.vera.y, 'arrow-tex');
    if (!arrow) return;
    arrow.setDepth(7).setDisplaySize(10, 10);

    const dirs = {
      up:    [0,          -ARROW_SPD],
      down:  [0,           ARROW_SPD],
      left:  [-ARROW_SPD,  0],
      right: [ ARROW_SPD,  0],
    };
    const [avx, avy] = dirs[this.facing];
    arrow.body.setVelocity(avx, avy);
    this._sfx('sfx-shot');
  }

  // ─── Esquive ─────────────────────────────────────────────────────────────

  _dodge(time) {
    if (this.dodging || time - this.lastDodge < DODGE_CD) return;
    this.dodging      = true;
    this.invulnerable = true;
    this.lastDodge    = time;

    this.tweens.add({
      targets:  this.vera,
      scale:    SCALE * 1.25,
      duration: DODGE_DUR / 2,
      ease:     'Sine.easeOut',
      yoyo:     true,
      onComplete: () => {
        this.vera.setScale(SCALE);
        this.dodging      = false;
        this.invulnerable = false;
      },
    });
  }

  // ─── Daño al jugador ─────────────────────────────────────────────────────

  recibirDanio() {
    if (this.invulnerable || this.muerto) return;
    let v = (this.registry.get('vidas') ?? 3) - 1;
    this.registry.set('vidas', v);
    this.actualizarCorazones();
    this._sfx('sfx-damage');

    if (v <= 0) { this.respawn(); return; }

    this.invulnerable = true;
    // Destello rojo (con tinte, NO alpha — así nunca desaparece)
    let n = 0;
    this.time.addEvent({
      delay: 150, repeat: 8,
      callback: () => {
        n++;
        if (!this.vera?.active) return;
        if (n % 2 === 1) this.vera.setTint(0xff5555);
        else             this.vera.clearTint();
      },
    });
    this.time.delayedCall(1400, () => {
      this.invulnerable = false;
      if (this.vera?.active) this.vera.clearTint();
    });
  }

  // Al perder las 3 vidas: REAPARECE en el inicio (el tiempo sigue corriendo).
  respawn() {
    this.registry.set('vidas', 3);
    this.actualizarCorazones();
    this.knockback = false;
    this.vera.clearTint();
    this.vera.setAlpha(1);
    this.vera.setVisible(true);
    this.vera.setVelocity(0, 0);
    this.vera.setPosition(this.startX, this.startY);
    this.cameras.main.centerOn(this.startX, this.startY);

    this.invulnerable = true;
    // Parpadeo SOLO con tinte (jamás oculta al jugador)
    let n = 0;
    this.time.addEvent({
      delay: 150, repeat: 10,
      callback: () => {
        n++;
        if (!this.vera?.active) return;
        if (n % 2 === 1) this.vera.setTint(0x66ccff);
        else             this.vera.clearTint();
      },
    });
    this.time.delayedCall(1700, () => {
      this.invulnerable = false;
      if (this.vera?.active) { this.vera.clearTint(); this.vera.setVisible(true); this.vera.setAlpha(1); }
    });

    const msg = this.add.text(this.scale.width / 2, this.scale.height / 2,
      'Has caído... vuelves al inicio', {
        fontFamily: 'monospace', fontSize: '22px', color: '#ffdddd',
        backgroundColor: '#000000cc', padding: { x: 12, y: 8 },
      }).setOrigin(0.5).setScrollFactor(0).setDepth(20000);
    this.time.delayedCall(1600, () => msg.destroy());
  }

  actualizarCorazones() {
    this._updateHUD();
  }

  // ─── IA enemigos ─────────────────────────────────────────────────────────

  _spawnEnemy(x, y) {
    const e = this.enemies.create(x, y, 'enemy');
    e.setScale(ENEMY_SCALE).setDepth(8);
    e.body.setSize(80, 80);
    e.body.setImmovable(true);
    e.body.moves = false;        // estático: custodia la pieza, no se mueve
    e.body.setVelocity(0, 0);
    e.hp       = ENEMY_HP;
    e.lastFire = this.time.now;
    e.play('drag_down');
  }

  _updateEnemies(time) {
    for (const e of this.enemies.getChildren()) {
      if (!e.active || !e.body) continue;

      const dx   = this.vera.x - e.x;
      const dy   = this.vera.y - e.y;
      const dist = Math.hypot(dx, dy) || 1;

      // Estático: solo orienta la mirada hacia el jugador
      if (Math.abs(dx) >= Math.abs(dy)) {
        e.play(dx > 0 ? 'drag_right' : 'drag_left', true);
      } else {
        e.play(dy > 0 ? 'drag_down' : 'drag_up', true);
      }

      // Dispara bolas de fuego si el jugador está en rango
      if (dist < ENEMY_ATK_RNG && time - e.lastFire > ENEMY_ATK_CD) {
        e.lastFire = time;
        this._spawnFireball(e);
      }
    }
  }

  _hitEnemy(enemy) {
    if (!enemy.active) return;
    enemy.hp -= 1;
    if (enemy.hp <= 0) {
      enemy.body.setEnable(false);
      this.tweens.add({
        targets: enemy, alpha: 0, scale: 0, duration: 300,
        onComplete: () => { if (enemy.scene) enemy.destroy(); },
      });
    } else {
      enemy.setTint(0xff4444);
      this.time.delayedCall(200, () => { if (enemy?.active) enemy.clearTint(); });
    }
  }

  _spawnFireball(enemy) {
    const fb = this.fireballs.create(enemy.x, enemy.y, 'fireball-tex');
    if (!fb) return;
    fb.setDepth(7).setDisplaySize(14, 14);
    const dx   = this.vera.x - enemy.x;
    const dy   = this.vera.y - enemy.y;
    const dist = Math.hypot(dx, dy) || 1;
    fb.body.setVelocity((dx / dist) * FIREBALL_SPD, (dy / dist) * FIREBALL_SPD);
    this._sfx('sfx-fireball');
  }

  // ─── Pieza y puerta ───────────────────────────────────────────────────────

  _buildPiece(x, y) {
    // Visual con tween de flotación (no-physics)
    this.pieceVisual = this.add.image(x, y, 'pieza').setDisplaySize(28, 28).setDepth(7);
    this.tweens.add({
      targets: this.pieceVisual,
      y: y - 8, duration: 900,
      ease: 'Sine.easeInOut', yoyo: true, repeat: -1,
    });

    // Zona de overlap (estática) — el overlap con vera se registra en create()
    this.pieceZone = this.add.zone(x, y, 36, 36);
    this.physics.add.existing(this.pieceZone, true);
  }

  _collectPiece() {
    if (this.pieceCollected) return;
    this.pieceCollected = true;

    if (this.pieceVisual) {
      this.tweens.killTweensOf(this.pieceVisual);
      this.tweens.add({
        targets: this.pieceVisual, alpha: 0, scale: 2, duration: 300,
        onComplete: () => this.pieceVisual?.destroy(),
      });
    }

    const piezas = (this.registry.get('piezas') ?? 0) + 1;
    this.registry.set('piezas', piezas);
    this._updateHUD();
    this._sfx('sfx-piece');

    this.exitActive = true;
    this._activateExit();
  }

  _buildExit(x, y) {
    // Indicador apagado (dim)
    this.exitIndicator = this.add.image(x, y, 'exit-glow')
      .setDisplaySize(70, 70)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setAlpha(0.18)
      .setDepth(6);

    // Zona de overlap — el overlap con vera se registra en create()
    this.exitZone = this.add.zone(x, y, 52, 52);
    this.physics.add.existing(this.exitZone, true);
  }

  _activateExit() {
    if (this.exitIndicator) this.exitIndicator.destroy();
    const { x, y } = this.exitPos;

    const glow = this.add.image(x, y, 'exit-glow')
      .setDisplaySize(100, 100)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setAlpha(0.35)
      .setDepth(6);

    this.tweens.add({
      targets: glow, alpha: { from: 0.35, to: 0.9 },
      duration: 700, ease: 'Sine.easeInOut', yoyo: true, repeat: -1,
    });
  }

  // ─── Portal (mapa3) ───────────────────────────────────────────────────────

  _buildNucleus(x, y) {
    if (!this.textures.exists('portal-glow')) {
      const g = this.make.graphics({ add: false });
      for (let i = 0; i <= 12; i++) {
        g.fillStyle(0xffaa44, 0.04 + i * 0.065);
        g.fillCircle(50, 50, 50 - i * 4);
      }
      g.generateTexture('portal-glow', 100, 100);
      g.destroy();
    }

    const displayW = 120;
    const displayH = Math.round((112 / 204) * displayW);
    const haloY    = y - Math.round(displayH / 2);

    const halo = this.add.image(x, haloY, 'portal-glow')
      .setDisplaySize(170, 170)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setAlpha(0.35)
      .setDepth(5);

    this.tweens.add({
      targets: halo, alpha: { from: 0.2, to: 0.6 },
      duration: 1100, ease: 'Sine.easeInOut', yoyo: true, repeat: -1,
    });

    this.add.image(x, y, 'nucleo')
      .setOrigin(0.5, 1)
      .setDisplaySize(displayW, displayH)
      .setDepth(6);
  }

  _setupPortalTrigger(x, y) {
    const zone = this.add.zone(x, y, 52, 52);
    this.physics.add.existing(zone, true);
    this.physics.add.overlap(this.vera, zone, () => {
      if (this.transitioning) return;
      this.transitioning = true;
      if (this.walkSnd?.isPlaying) this.walkSnd.stop();
      this._sfx('sfx-portal');
      this.cameras.main.fadeOut(500, 0, 0, 0);
      this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
        this.scene.start('VictoryScene');
      });
    });
  }

  // ─── Temporizador ────────────────────────────────────────────────────────

  _updateTimer(delta) {
    if (this.transitioning) return;
    this.timeLeft -= delta / 1000;

    if (this.timeLeft <= 0) {
      this.timeLeft      = 0;
      this.transitioning = true;
      this._updateHUD();
      this.cameras.main.fadeOut(500, 0, 0, 0);
      this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
        this.scene.start('GameOverScene');
      });
      return;
    }

    const secs = Math.ceil(this.timeLeft);
    if (secs !== this._lastSecs) {
      this._lastSecs = secs;
      this._updateHUD();
    }
  }

  // ─── HUD ─────────────────────────────────────────────────────────────────

  _buildHUD() {
    const W   = this.scale.width;
    const PAD = 8;
    const H   = 38;

    this.add.rectangle(0, 0, W, H + PAD * 2, 0x000000, 0.65)
      .setOrigin(0, 0).setScrollFactor(0).setDepth(HUD_DEPTH - 1);

    const ts = { fontFamily: 'monospace', fontSize: '17px', color: '#ffffff' };
    const y  = PAD + H / 2;

    this.txtVidas  = this.add.text(14, y, '', ts)
      .setOrigin(0, 0.5).setScrollFactor(0).setDepth(HUD_DEPTH);
    this.txtTiempo = this.add.text(W / 2, y, '', ts)
      .setOrigin(0.5, 0.5).setScrollFactor(0).setDepth(HUD_DEPTH);
    this.txtPiezas = this.add.text(W - 14, y, '', ts)
      .setOrigin(1, 0.5).setScrollFactor(0).setDepth(HUD_DEPTH);

    this._updateHUD();
  }

  _updateHUD() {
    if (!this.txtVidas) return;
    const vidas  = this.registry.get('vidas')  ?? 3;
    const piezas = this.registry.get('piezas') ?? 0;
    const secs   = Math.max(0, Math.ceil(this.timeLeft));
    const mm     = String(Math.floor(secs / 60)).padStart(2, '0');
    const ss     = String(secs % 60).padStart(2, '0');

    this.txtVidas.setText('♥ '.repeat(Math.max(0, vidas)).trim() || '✕');
    this.txtTiempo.setText(`${mm}:${ss}`);
    this.txtPiezas.setText(`Piezas: ${piezas}/2`);
  }

  // ─── Limpieza proyectiles ─────────────────────────────────────────────────

  _cleanupProjectiles() {
    const b = this.physics.world.bounds;
    const offscreen = s =>
      s.x < b.x - 60 || s.x > b.right + 60 ||
      s.y < b.y - 60 || s.y > b.bottom + 60;

    this.arrows.getChildren().forEach(s => { if (s.active && offscreen(s)) s.destroy(); });
    this.fireballs.getChildren().forEach(s => { if (s.active && offscreen(s)) s.destroy(); });
  }

  // ─── Animaciones ─────────────────────────────────────────────────────────

  _createAnims() {
    const def = (key, sheet, start, end, fps) => {
      if (this.anims.exists(key)) return;
      this.anims.create({
        key,
        frames:    this.anims.generateFrameNumbers(sheet, { start, end }),
        frameRate: fps,
        repeat:    -1,
      });
    };
    // Jugadora
    def('walk-down', 'player', 0, 2, ANIM_FPS);
    def('walk-up',   'player', 4, 6, ANIM_FPS);
    def('walk-left', 'player', 8, 10, ANIM_FPS);
    // Dragón  (fila0=arriba, fila1=izq, fila2=der, fila3=abajo)
    def('drag_up',    'enemy', 0,  2,  ENEMY_FPS);
    def('drag_left',  'enemy', 3,  5,  ENEMY_FPS);
    def('drag_right', 'enemy', 6,  8,  ENEMY_FPS);
    def('drag_down',  'enemy', 9,  11, ENEMY_FPS);
  }

  // ─── Texturas generadas ───────────────────────────────────────────────────

  _createTextures() {
    // Portal glow (naranja)
    if (!this.textures.exists('portal-glow')) {
      const g = this.make.graphics({ add: false });
      for (let i = 0; i <= 12; i++) {
        g.fillStyle(0xffaa44, 0.04 + i * 0.065);
        g.fillCircle(50, 50, 50 - i * 4);
      }
      g.generateTexture('portal-glow', 100, 100);
      g.destroy();
    }
    // Exit glow (cian)
    if (!this.textures.exists('exit-glow')) {
      const g = this.make.graphics({ add: false });
      for (let i = 0; i <= 12; i++) {
        g.fillStyle(0x44ccff, 0.04 + i * 0.065);
        g.fillCircle(50, 50, 50 - i * 4);
      }
      g.generateTexture('exit-glow', 100, 100);
      g.destroy();
    }
    // Flecha
    if (!this.textures.exists('arrow-tex')) {
      const g = this.make.graphics({ add: false });
      g.fillStyle(0xffffaa, 1);
      g.fillCircle(5, 5, 5);
      g.fillStyle(0xffffff, 0.85);
      g.fillCircle(5, 5, 2.5);
      g.generateTexture('arrow-tex', 10, 10);
      g.destroy();
    }
    // Bola de fuego
    if (!this.textures.exists('fireball-tex')) {
      const g = this.make.graphics({ add: false });
      g.fillStyle(0xff6600, 1);
      g.fillCircle(8, 8, 8);
      g.fillStyle(0xffcc00, 1);
      g.fillCircle(8, 8, 5);
      g.generateTexture('fireball-tex', 16, 16);
      g.destroy();
    }
  }

  // ─── Audio ───────────────────────────────────────────────────────────────

  _sfx(key) {
    if (this.cache.audio.exists(key)) this.sound.play(key, { volume: 0.6 });
  }
}
