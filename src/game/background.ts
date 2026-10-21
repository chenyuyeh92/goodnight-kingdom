import Phaser from 'phaser';

const LAYERS = [
  { key: 'bg-far', factor: 0.1 },
  { key: 'bg-mid', factor: 0.35 },
  { key: 'bg-near', factor: 0.7 },
] as const;
const DEPTH = -20;

/**
 * 三層視差背景:越遠捲得越慢。每層用兩張圖頭尾相接輪流往左移(素材寬度都大於畫面,兩張就蓋得滿),
 * 比 TileSprite 省效能。素材沒載入時什麼都不畫,只剩底色。
 */
export class ParallaxBackground {
  private readonly layers: { images: Phaser.GameObjects.Image[]; w: number; factor: number }[] = [];

  constructor(scene: Phaser.Scene) {
    LAYERS.forEach((l, i) => {
      if (!scene.textures.exists(l.key)) return;
      const images = [0, 1].map(() => scene.add.image(0, 0, l.key).setOrigin(0, 0).setScrollFactor(0).setDepth(DEPTH + i));
      this.layers.push({ images, w: images[0].width, factor: l.factor });
    });
    this.update(0);
  }

  update(scrollX: number): void {
    for (const l of this.layers) {
      const offset = (scrollX * l.factor) % l.w;
      l.images[0].x = -offset;
      l.images[1].x = l.w - offset;
    }
  }
}
