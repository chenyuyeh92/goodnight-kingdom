import { describe, test, expect } from 'vitest';
import { ENEMY_DEFS, SPIT_GRAVITY, VULTURE_SWOOP_Y, arcShot, initialBrain, stepEnemy, type EnemyBrain, type EnemySense } from '../src/game/enemies';

const sense = (over: Partial<EnemySense> = {}): EnemySense => ({ x: 500, y: 458, grounded: true, targetX: 300, targetY: 460, dtMs: 50, ...over });

function simulate(type: Parameters<typeof stepEnemy>[0], ms: number, over: Partial<EnemySense> = {}) {
  let brain = initialBrain(type);
  const moves = [];
  for (let t = 0; t < ms; t += 50) {
    const m = stepEnemy(type, brain, sense(over));
    brain = m.brain;
    moves.push(m);
  }
  return moves;
}

describe('世界 2 的魔物', () => {
  test('聖甲蟲平常走過來,每 3 秒衝刺一下', () => {
    const moves = simulate('bellScarab', 4000);
    expect(moves[0].vx).toBeLessThan(0);
    const speeds = moves.map((m) => Math.abs(m.vx));
    expect(Math.max(...speeds)).toBeGreaterThan(Math.min(...speeds) * 2);
    expect(moves.some((m) => m.brain.phase === 'dash')).toBe(true);
  });

  test('木乃伊貓一跳一跳靠近', () => {
    const moves = simulate('mummyCat', 1500);
    expect(moves.filter((m) => m.vy !== null && m.vy < 0).length).toBeGreaterThanOrEqual(2);
  });

  test('咖啡沙蛇原地不動,每 2.5 秒吐一口;太遠不吐', () => {
    const moves = simulate('sandSnake', 5100);
    expect(moves.every((m) => m.vx === 0)).toBe(true);
    expect(moves.filter((m) => m.spit).length).toBe(2);
    expect(simulate('sandSnake', 5100, { targetX: 1200 }).filter((m) => m.spit).length).toBe(0);
    expect(simulate('sandSnake', 5100, { targetX: null }).filter((m) => m.spit).length).toBe(0);
  });

  test('拋物線子彈會落在目標附近', () => {
    const { vx, vy } = arcShot(500, 420, 300, 460, SPIT_GRAVITY);
    const t = (300 - 500) / vx;
    expect(t).toBeGreaterThan(0);
    expect(420 + vy * t + 0.5 * SPIT_GRAVITY * t * t).toBeCloseTo(460);
    expect(vy).toBeLessThan(0);
  });

  test('禿鷹俯衝最低點,身體底部高於 452(蹲下閃得過)', () => {
    expect(VULTURE_SWOOP_Y + ENEMY_DEFS.vulture.h / 2).toBeLessThan(452);
    const moves = simulate('vulture', 3000, { targetX: 520, y: 250 });
    expect(moves.some((m) => m.brain.phase === 'swoop')).toBe(true);
  });

  test('陸龜有殼盾、不滾,轉身比刺蝟慢', () => {
    expect(ENEMY_DEFS.tortoise.shield).toBe(true);
    const moves = simulate('tortoise', 6000);
    expect(moves.every((m) => m.brain.phase === 'walk')).toBe(true);
    // 目標跑到背後:1 秒內還沒轉身。
    let brain: EnemyBrain = { ...initialBrain('tortoise'), facing: -1 };
    for (let t = 0; t < 1000; t += 50) brain = stepEnemy('tortoise', brain, sense({ targetX: 800 })).brain;
    expect(brain.facing).toBe(-1);
    for (let t = 0; t < 400; t += 50) brain = stepEnemy('tortoise', brain, sense({ targetX: 800 })).brain;
    expect(brain.facing).toBe(1);
  });
});
