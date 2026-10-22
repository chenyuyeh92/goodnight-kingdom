import type { EnemyType } from '../game/enemies';
import type { SpawnFrom, TrickleDef } from '../game/encounters';

/** 同一組魔物依序出現:觸發位置每隻差 40(鏡頭走約 0.2 秒)。 */
const TRICKLE_GAP = 40;

/** 一組零星魔物:[種類, 方向, 數量, 高度?];ground/top 的 x 用 groundX;同一種的高度每隻往下錯開 60。 */
export function wave(at: number, parts: readonly [EnemyType, SpawnFrom, number, number?][], groundX?: number): TrickleDef[] {
  const out: TrickleDef[] = [];
  for (const [type, from, n, y] of parts) {
    for (let i = 0; i < n; i++) {
      const x = from === 'ground' || from === 'top' ? groundX : undefined;
      const spawn = { type, from, x, delayMs: 0, ...(y !== undefined ? { y: y + i * 60 } : {}) };
      out.push({ triggerScrollX: at + out.length * TRICKLE_GAP, spawn });
    }
  }
  return out;
}
