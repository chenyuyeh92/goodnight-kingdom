import { MAX_DT_MS } from '../config/tuning';
import { bulletVelocity } from './fire';
import type { Aim, Facing } from './playerMotor';

export const HOMING_TURN_DEG_PER_SEC = 360;
export const BOOMERANG_OUT_MS = 400;

const DEG = Math.PI / 180;

/** 以瞄準方向為中心,在 ±spreadDeg/2 之間平均分布 count 發。 */
export function pelletVelocities(aim: Aim, facing: Facing, speed: number, count: number, spreadDeg: number): { vx: number; vy: number }[] {
  const center = bulletVelocity(aim, facing, speed);
  const base = Math.atan2(center.vy, center.vx);
  return Array.from({ length: count }, (_, i) => {
    const offset = count === 1 ? 0 : (-spreadDeg / 2 + (spreadDeg * i) / (count - 1)) * DEG;
    return { vx: Math.cos(base + offset) * speed, vy: Math.sin(base + offset) * speed };
  });
}

/** 把速度方向往目標轉,每秒最多轉 maxTurnDegPerSec 度,速率不變。 */
export function steerToward(
  vx: number,
  vy: number,
  fromX: number,
  fromY: number,
  targetX: number,
  targetY: number,
  maxTurnDegPerSec: number,
  dtMs: number,
): { vx: number; vy: number } {
  const speed = Math.hypot(vx, vy);
  const current = Math.atan2(vy, vx);
  const wanted = Math.atan2(targetY - fromY, targetX - fromX);
  let diff = wanted - current;
  while (diff > Math.PI) diff -= 2 * Math.PI;
  while (diff < -Math.PI) diff += 2 * Math.PI;
  const maxTurn = maxTurnDegPerSec * DEG * (Math.min(dtMs, MAX_DT_MS) / 1000);
  const angle = current + Math.max(-maxTurn, Math.min(maxTurn, diff));
  return { vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed };
}

/** 飛出去 400ms 後以原速率飛回主人;主人不在時沿原方向飛走。 */
export function boomerangVelocity(
  ageMs: number,
  initial: { vx: number; vy: number },
  pos: { x: number; y: number },
  owner: { x: number; y: number } | null,
): { vx: number; vy: number } {
  if (ageMs < BOOMERANG_OUT_MS || owner === null) return initial;
  const speed = Math.hypot(initial.vx, initial.vy);
  const dx = owner.x - pos.x;
  const dy = owner.y - pos.y;
  const d = Math.hypot(dx, dy) || 1;
  return { vx: (dx / d) * speed, vy: (dy / d) * speed };
}

/** 懷錶集氣:輕按 3 點,線性加到集滿(1.2 秒)22 點。 */
export function chargeDamage(ms: number, min = 3, max = 22, maxMs = 1200): number {
  return min + ((max - min) * Math.min(Math.max(ms, 0), maxMs)) / maxMs;
}

/** 集越久催眠波越大:輕按 1 倍,集滿 2.5 倍。 */
export function chargeScale(ms: number, maxMs = 1200): number {
  return 1 + (1.5 * Math.min(Math.max(ms, 0), maxMs)) / maxMs;
}

/** 流星的落點:在玩家前方 160–360 px 之間隨機。 */
export function meteorTargetX(x: number, facing: 1 | -1, rng: () => number): number {
  return x + facing * (160 + 200 * rng());
}

/** 爆炸的圓碰到魔物的方框(離方框最近的點在半徑以內)。 */
export function inBlast(cx: number, cy: number, r: number, box: { x: number; y: number; w: number; h: number }): boolean {
  const nx = Math.max(box.x, Math.min(cx, box.x + box.w));
  const ny = Math.max(box.y, Math.min(cy, box.y + box.h));
  return Math.hypot(cx - nx, cy - ny) <= r;
}

/** 彈跳:碰地(或平台頂)垂直速度反過來、留 3/4;碰牆水平反過來。 */
export const BOUNCE_KEEP = 0.75;
export function bounceOff(v: { vx: number; vy: number }, surface: 'floor' | 'wall'): { vx: number; vy: number } {
  return surface === 'floor' ? { vx: v.vx, vy: -Math.abs(v.vy) * BOUNCE_KEEP } : { vx: -v.vx, vy: v.vy };
}

/** 流星:落點在前方 160–360(夾在畫面裡),從落點後方 120 的上空斜斜落下(出來的地方也在畫面裡)。 */
const METEOR_BACK = 120;
const METEOR_VIEW_MARGIN = 40;
export function meteorPath(x: number, facing: 1 | -1, scrollX: number, viewW: number, rng: () => number): { fromX: number; toX: number } {
  const lo = scrollX + METEOR_VIEW_MARGIN;
  const hi = scrollX + viewW - METEOR_VIEW_MARGIN;
  const clamp = (v: number): number => Math.min(hi, Math.max(lo, v));
  const toX = clamp(meteorTargetX(x, facing, rng));
  return { fromX: clamp(toX - facing * METEOR_BACK), toX };
}

/** 卡進地形的球:往壓進去最少的那一邊推出來。 */
export function pushOutSide(
  ball: { left: number; right: number; top: number; bottom: number },
  rect: { left: number; right: number; top: number; bottom: number },
): 'top' | 'bottom' | 'left' | 'right' {
  const pen = { top: ball.bottom - rect.top, bottom: rect.bottom - ball.top, left: ball.right - rect.left, right: rect.right - ball.left };
  return (Object.keys(pen) as (keyof typeof pen)[]).reduce((a, b) => (pen[b] < pen[a] ? b : a));
}
