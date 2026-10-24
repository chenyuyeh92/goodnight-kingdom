import { test, expect } from 'vitest';
import {
  BAT_SWOOP_Y,
  ENEMY_DEFS,
  bulletEffect,
  SHIELD_HP,
  wearShield,
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
  expect(ENEMY_DEFS.hedgehog).toMatchObject({ tier: 'mid', hp: 6, shield: true, name: { zh: '失眠刺蝟', en: 'Sleepless Hedgehog' } });
  expect(ENEMY_DEFS.nightBat.flying).toBe(true);
  expect(ENEMY_DEFS.alarmBug).toMatchObject({ tier: 'minion', hp: 2, w: 38, h: 44 });
});

test('地面魔物至少 32 高,站著射擊(槍口在腳底上方 30)打得到', () => {
  for (const def of Object.values(ENEMY_DEFS)) {
    if (!def.flying) expect(def.h).toBeGreaterThanOrEqual(32);
  }
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
  expect(swoop.vy).toBe((BAT_SWOOP_Y - 340) * 5);
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

test('盾牌擋下 15 點傷害就破掉,破掉之後正面也打得到', () => {
  let shield = SHIELD_HP;
  const broke: boolean[] = [];
  for (let i = 0; i < 15; i++) {
    const r = wearShield(shield, 1);
    shield = r.shieldHp;
    broke.push(r.broke);
  }
  expect(SHIELD_HP).toBe(15);
  expect(shield).toBe(0);
  expect(broke.filter(Boolean)).toHaveLength(1);
  expect(broke[14]).toBe(true);
  // 揮擊(5 點)三下就破。
  expect(wearShield(wearShield(wearShield(SHIELD_HP, 5).shieldHp, 5).shieldHp, 5).broke).toBe(true);
  expect(wearShield(0, 1)).toEqual({ shieldHp: 0, broke: false });
  expect(bulletEffect(ENEMY_DEFS.tortoise, -1, 640, 0, false, false)).toBe('hit');
  // 關主縮殼(armored)不會因為盾破掉就打得到。
  expect(bulletEffect(ENEMY_DEFS.tortoise, -1, 640, 0, true, false)).toBe('blocked');
});

test('刺蝟不會瞬間轉身:玩家在背後超過 700ms 才轉過來', () => {
  // 刺蝟在 500 面向左,玩家跳到背後 900。
  let brain = stepEnemy('hedgehog', initialBrain('hedgehog'), sense()).brain;
  expect(brain.facing).toBe(-1);
  for (let t = 0; t < 650; t += 50) brain = stepEnemy('hedgehog', brain, sense({ targetX: 900, dtMs: 50 })).brain;
  expect(brain.facing).toBe(-1);
  for (let t = 0; t < 100; t += 50) brain = stepEnemy('hedgehog', brain, sense({ targetX: 900, dtMs: 50 })).brain;
  expect(brain.facing).toBe(1);
});

test('刺蝟轉身計時在玩家回到正面時重算', () => {
  let brain = stepEnemy('hedgehog', initialBrain('hedgehog'), sense()).brain;
  for (let t = 0; t < 600; t += 50) brain = stepEnemy('hedgehog', brain, sense({ targetX: 900, dtMs: 50 })).brain;
  brain = stepEnemy('hedgehog', brain, sense({ targetX: 200, dtMs: 50 })).brain;
  for (let t = 0; t < 600; t += 50) brain = stepEnemy('hedgehog', brain, sense({ targetX: 900, dtMs: 50 })).brain;
  expect(brain.facing).toBe(-1);
});

test('刺蝟滾過玩家後不會一停下就轉身', () => {
  const rolling = run('hedgehog', 3000, { dtMs: 50 });
  const after = run('hedgehog', 1000, { dtMs: 50, targetX: 900 }, rolling.brain);
  expect(after.brain.phase).toBe('walk');
  expect(after.brain.facing).toBe(-1);
});

test('刺盾:帶一點斜度的迎面子彈也擋得住(扇形、追蹤)', () => {
  const def = ENEMY_DEFS.hedgehog;
  expect(bulletEffect(def, -1, 520, 6.4e-14)).toBe('blocked');
  expect(bulletEffect(def, -1, 500, 140)).toBe('blocked');
  expect(bulletEffect(def, 1, -420, -100)).toBe('blocked');
});

test('刺盾:比較接近垂直的子彈(從上方打)打得到', () => {
  const def = ENEMY_DEFS.hedgehog;
  expect(bulletEffect(def, -1, 200, 500)).toBe('hit');
});

test('蝙蝠俯衝最低時身體底部高於 452,蹲下(判定 28 高)閃得過', () => {
  expect(BAT_SWOOP_Y + ENEMY_DEFS.nightBat.h / 2).toBeLessThan(452);
});

test('魔物判定寬至少是圖片的七成、高至少五成,看得到的地方大多打得到', () => {
  const art = { alarmBug: [48, 56], coffeeBean: [39, 52], nightBat: [56, 56], hedgehog: [80, 72] } as const;
  for (const [type, [w, h]] of Object.entries(art)) {
    const d = ENEMY_DEFS[type as keyof typeof art];
    expect(d.w / w, type).toBeGreaterThanOrEqual(0.7);
    expect(d.h / h, type).toBeGreaterThanOrEqual(0.5);
  }
});
