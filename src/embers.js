// Brasas/ceniza flotando hacia arriba — ambientación para las pantallas.
export function addEmbers(scene, color = 0xff8844, count = 26) {
  const W = scene.scale.width;
  const H = scene.scale.height;
  const key = 'ember-' + color;

  if (!scene.textures.exists(key)) {
    const g = scene.make.graphics({ add: false });
    g.fillStyle(color, 1);   g.fillCircle(4, 4, 4);
    g.fillStyle(0xffffff, 0.6); g.fillCircle(4, 4, 1.5);
    g.generateTexture(key, 8, 8);
    g.destroy();
  }

  for (let i = 0; i < count; i++) {
    const s = scene.add.image(0, 0, key)
      .setAlpha(0)
      .setDepth(0)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setScale(Phaser.Math.FloatBetween(0.3, 1.1));

    const drift = () => {
      if (!s.scene) return;
      s.setPosition(Phaser.Math.Between(0, W), H + 12).setAlpha(0);
      scene.tweens.add({
        targets:  s,
        y:        -12,
        x:        s.x + Phaser.Math.Between(-50, 50),
        alpha:    { from: 0, to: Phaser.Math.FloatBetween(0.35, 0.85) },
        duration: Phaser.Math.Between(4500, 9500),
        ease:     'Sine.easeInOut',
        onComplete: drift,
      });
    };
    scene.time.delayedCall(Phaser.Math.Between(0, 6000), drift);
  }
}
