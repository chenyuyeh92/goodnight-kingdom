import Phaser from 'phaser';

const LAYERS = [
  { key: 'bg-far', factor: 0.1 },
  { key: 'bg-mid', factor: 0.35 },
  { key: 'bg-near', factor: 0.7 },
] as const;
const VIEW_W = 960;
const VIEW_H = 540;
const DEPTH = -20;

/** 三層視差背景:越遠捲得越慢。素材沒載入時什麼都不畫,只剩底色。 */
export class ParallaxBackground {
  private readonly layers: { sprite: Phaser.GameObjects.TileSprite; factor: number }[] = [];

  constructor(scene: Phaser.Scene) {
    LAYERS.forEach((l, i) => {
      if (!scene.textures.exists(l.key)) return;
      const sprite = scene.add.tileSprite(0, 0, VIEW_W, VIEW_H, l.key).setOrigin(0, 0).setScrollFactor(0).setDepth(DEPTH + i);
      this.layers.push({ sprite, factor: l.factor });
    });
  }

  update(scrollX: number): void {
    for (const l of this.layers) l.sprite.tilePositionX = scrollX * l.factor;
  }
}
