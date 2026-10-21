import { test, expect } from 'vitest';
import {
  ENEMY_DEFS,
  bulletEffect,
  initialBrain,
  stepEnemy,
  type EnemyBrain,
  type EnemySense,
  type EnemyType,
} from '../src/game/enemies';

function sense(p: Partial<EnemySense> = {}): EnemySense {
  return { x: 500, y: 460, grounded: true, targetX: 200, dtMs: 16, ...p };
}

function run(type: EnemyType, ms: number, p: Partial<EnemySense> = {}, brain: EnemyBrain = initialBrain(type)) {
  let out = stepEnemy(type, brain, sense(p));
  for (let t = p.dtMs ?? 16; t < ms; t += p.dtMs ?? 16) out = stepEnemy(type, out.brain, sense(p));
  return out;
}

test('資料表:刺蝟是中階、6 血、有盾;蝙蝠會飛', () => {
  expect(ENEMY_DEFS.hedgehog).toMatchObject({ tier: 'mid', hp: 6, shield: true, name: '失眠刺蝟' });
  expect(ENEMY_DEFS.nightBat.flying).toBe(true);
  expect(ENEMY_DEFS.alarmBug).toMatchObject({ tier: 'minion', hp: 2, w: 32, h: 24 });
});

test('鬧鐘蟲朝目標走 70', () => {
  const left = stepEnemy('alarmBug', initialBrain('alarmBug'), sense());
  expect(left.vx).toBe(-70);
  expect(left.brain.facing).toBe(-1);
  expect(stepEnemy('alarmBug', initialBrain('alarmBug'), sense({ targetX: 900 })).vx).toBe(70);
});

test('沒有目標時不動', () => {
  expect(stepEnemy('alarmBug', initialBrain('alarmBug'), sense({ targetX: null })).vx).toBe(0);
});

test('咖啡豆每 900ms 跳一次', () => {
  let brain = initialBrain('coffeeBean');
  for (let i = 1; i <= 56; i++) {
    const o = stepEnemy('coffeeBean', brain, sense());
    expect(o.vy).toBeNull();
    brain = o.brain;
  }
  const jump = stepEnemy('coffeeBean', brain, sense());
  expect(jump.vy).toBe(-520);
  expect(jump.vx).toBe(-130);
  expect(jump.brain.timerMs).toBe(0);
});

test('咖啡豆在空中保持水平速度', () => {
  const o = stepEnemy('coffeeBean', initialBrain('coffeeBean'), sense({ grounded: false }));
  expect(o.vx).toBe(-130);
  expect(o.vy).toBeNull();
});

test('蝙蝠盤旋時往 y=320 拉', () => {
  expect(stepEnemy('nightBat', initialBrain('nightBat'), sense({ y: 400 })).vy).toBe(-320);
});

test('蝙蝠在目標正上方盤旋 2 秒後俯衝,700ms 後回升', () => {
  const hover = run('nightBat', 2000, { x: 200, targetX: 210, y: 320, dtMs: 50 });
  expect(hover.brain.phase).toBe('swoop');
  const swoop = stepEnemy('nightBat', hover.brain, sense({ x: 200, targetX: 210, y: 340 }));
  expect(swoop.vy).toBe(500);
  expect(swoop.vx).toBe(0);
  const back = run('nightBat', 700, { x: 200, targetX: 210, y: 400, dtMs: 50 }, hover.brain);
  expect(back.brain.phase).toBe('hover');
});

test('刺蝟走 3 秒後滾動 1 秒,滾動中不轉向', () => {
  const rolling = run('hedgehog', 3000, { dtMs: 50 });
  expect(rolling.brain.phase).toBe('roll');
  const r = stepEnemy('hedgehog', rolling.brain, sense({ targetX: 900 }));
  expect(r.vx).toBe(-260);
  expect(r.brain.facing).toBe(-1);
  const after = run('hedgehog', 1000, { dtMs: 50, targetX: 900 }, rolling.brain);
  expect(after.brain.phase).toBe('walk');
});

test('dt 夾到 50', () => {
  expect(stepEnemy('hedgehog', initialBrain('hedgehog'), sense({ dtMs: 5000 })).brain.timerMs).toBe(50);
});

test('刺盾:只擋迎面的水平子彈', () => {
  const def = ENEMY_DEFS.hedgehog;
  expect(bulletEffect(def, -1, 640, 0)).toBe('blocked');
  expect(bulletEffect(def, -1, -640, 0)).toBe('hit');
  expect(bulletEffect(def, -1, 0, 640)).toBe('hit');
  expect(bulletEffect(ENEMY_DEFS.alarmBug, -1, 640, 0)).toBe('hit');
});
