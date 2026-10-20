export interface Tuning {
  walkSpeed: number;
  crawlSpeed: number;
  airSpeed: number;
  jumpVelocity: number;
  gravity: number;
  coyoteMs: number;
  jumpBufferMs: number;
  fireIntervalMs: number;
  bulletSpeed: number;
  hitStopMs: number;
  shakeMs: number;
  shakeIntensity: number;
}

export const DEFAULT_TUNING: Readonly<Tuning> = Object.freeze({
  walkSpeed: 180,
  crawlSpeed: 60,
  airSpeed: 150,
  jumpVelocity: 560,
  gravity: 1500,
  coyoteMs: 100,
  jumpBufferMs: 120,
  fireIntervalMs: 160,
  bulletSpeed: 620,
  hitStopMs: 60,
  shakeMs: 80,
  shakeIntensity: 0.004,
});

/** 每格時間差上限,避免卡頓或切回分頁時穿牆、一次跳過計時。 */
export const MAX_DT_MS = 50;
