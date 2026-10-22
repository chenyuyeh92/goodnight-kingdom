import Phaser from 'phaser';
import type { Current } from './currents';

const TINT = 0xb8f0ff;
/** 每道水流每隔這麼久冒一個流動的小泡泡。 */
const SPAWN_MS = 140;
const LIFE_MS = 1100;

/** 畫水流與氣泡柱:淡淡的範圍,加上順著水流方向漂的小泡泡。 */
export class CurrentsView {
  private elapsed = 0;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly currents: readonly Current[],
  ) {
    const g = scene.add.graphics().setDepth(-3);
    for (const c of currents) {
      g.fillStyle(TINT, 0.1).fillRoundedRect(c.x, c.y, c.w, c.h, 12);
      // 箭頭標出方向。
      g.fillStyle(TINT, 0.35);
      const cx = c.x + c.w / 2;
      const cy = c.y + c.h / 2;
      if (c.vy < 0) g.fillTriangle(cx - 12, cy + 6, cx + 12, cy + 6, cx, cy - 12);
      else g.fillTriangle(cx - 6 * Math.sign(c.vx), cy - 12, cx - 6 * Math.sign(c.vx), cy + 12, cx + 12 * Math.sign(c.vx), cy);
    }
  }

  /** 只在畫面附近的水流冒泡泡。 */
  update(dtMs: number, scrollX: number, viewW: number): void {
    this.elapsed += dtMs;
    if (this.elapsed < SPAWN_MS) return;
    this.elapsed = 0;
    for (const c of this.currents) {
      if (c.x > scrollX + viewW || c.x + c.w < scrollX) continue;
      const up = c.vy < 0;
      const x = up ? c.x + Math.random() * c.w : c.vx > 0 ? c.x : c.x + c.w;
      const y = up ? c.y + c.h : c.y + Math.random() * c.h;
      const dot = this.scene.add.circle(x, y, 3 + Math.random() * 2, TINT, 0.6).setDepth(-3);
      const dx = up ? 0 : Math.sign(c.vx) * c.w;
      const dy = up ? -c.h : 0;
      this.scene.tweens.add({ targets: dot, x: x + dx, y: y + dy, alpha: 0, duration: LIFE_MS, onComplete: () => dot.destroy() });
    }
  }
}
