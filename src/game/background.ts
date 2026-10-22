import Phaser from 'phaser';
import { LAYER_FACTORS, SCENE_LAYERS, sceneBlend, tileCount, type ScenePlan, type SceneId } from '../art/scenes';

const DEPTH = -20;

interface Layer {
  images: Phaser.GameObjects.Image[];
  w: number;
  factor: number;
  /** 遠景不透明,換場時舊的不用淡出;中景近景透明,舊的要跟著淡出。 */
  opaque: boolean;
}

/**
 * 三層視差背景:越遠捲得越慢,每層排幾張圖頭尾相接。關卡有多個場景時依鏡頭位置淡入下一個場景。
 * 素材沒載入的場景不畫,只剩底色。
 */
export class ParallaxBackground {
  private readonly scenes = new Map<SceneId, Layer[]>();

  constructor(
    scene: Phaser.Scene,
    private readonly plan: readonly ScenePlan[],
  ) {
    plan.forEach((p, si) => {
      const layers: Layer[] = [];
      SCENE_LAYERS[p.scene].forEach((key, li) => {
        if (!scene.textures.exists(key)) return;
        const w = scene.textures.get(key).getSourceImage().width;
        // 同一層裡後面的場景疊在前面的場景上面,淡入時蓋過去。
        const depth = DEPTH + li + si * 0.1;
        const images = Array.from({ length: tileCount(w) }, () =>
          scene.add.image(0, 0, key).setOrigin(0, 0).setScrollFactor(0).setDepth(depth),
        );
        layers.push({ images, w, factor: LAYER_FACTORS[li], opaque: li === 0 });
      });
      this.scenes.set(p.scene, layers);
    });
    this.update(0);
  }

  update(scrollX: number): void {
    const blend = sceneBlend(this.plan, scrollX);
    for (const [id, layers] of this.scenes) {
      const alpha = id === blend.to ? blend.t : id === blend.from ? 1 : 0;
      for (const l of layers) {
        const a = id === blend.from && blend.to && !l.opaque ? 1 - blend.t : alpha;
        const offset = (scrollX * l.factor) % l.w;
        l.images.forEach((img, i) => img.setVisible(a > 0).setAlpha(a).setX(i * l.w - offset));
      }
    }
  }
}
