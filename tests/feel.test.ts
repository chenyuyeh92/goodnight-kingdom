import { test, expect } from 'vitest';
import { DEFAULT_TUNING } from '../src/config/tuning';
import { WEAPONS, type WeaponId } from '../src/game/weapons';
import { MUZZLE, NO_COMBO, comboDefeat, comboStyle, comboTick, heldPose, knockbackSpeed, shootGapMs } from '../src/game/feel';

test('每把武器的射擊聲間隔比射擊間隔短(每一發都有聲音)', () => {
  for (const def of Object.values(WEAPONS)) {
    const interval = def.fireIntervalMs ?? DEFAULT_TUNING.fireIntervalMs;
    expect(shootGapMs(interval), def.id).toBeLessThan(interval);
    expect(shootGapMs(interval), def.id).toBeGreaterThan(0);
  }
});

test('被打中往後退:傷害越大退越多,有上限', () => {
  expect(knockbackSpeed(1)).toBe(30);
  expect(knockbackSpeed(6)).toBe(120);
  expect(knockbackSpeed(100)).toBe(120);
});

test('連續哄睡:2 秒內再打倒就累加,超過就歸零,最多的記住', () => {
  let c = comboDefeat(NO_COMBO);
  expect(c.count).toBe(1);
  c = comboDefeat(comboTick(c, 1999));
  expect(c.count).toBe(2);
  c = comboTick(c, 2001);
  expect(c.count).toBe(0);
  expect(c.best).toBe(2);
  c = comboDefeat(c);
  expect(c.count).toBe(1);
  expect(c.best).toBe(2);
});

test('連擊數越大字越大、顏色越亮', () => {
  expect(comboStyle(2).color).toBe('#f3e9d2');
  expect(comboStyle(3).color).toBe('#ffe08a');
  expect(comboStyle(5).color).toBe('#ffb060');
  expect(comboStyle(10).color).toBe('#ff8ac8');
  expect(comboStyle(10).fontSize).toBe(42);
  expect(comboStyle(20).fontSize).toBe(42);
  expect(comboStyle(3).fontSize).toBeLessThan(comboStyle(5).fontSize);
});

test('每把武器都有槍口位置(圖上的比例)', () => {
  for (const id of Object.keys(WEAPONS) as WeaponId[]) {
    const m = MUZZLE[id];
    expect(m, id).toBeDefined();
    for (const v of [m.x, m.y]) {
      expect(v, id).toBeGreaterThanOrEqual(0);
      expect(v, id).toBeLessThanOrEqual(1);
    }
  }
});

test('手上武器的角度:朝左翻轉、往上 −90、往下 90', () => {
  expect(heldPose('forward', 1)).toEqual({ angle: 0, flipX: false });
  expect(heldPose('forward', -1).flipX).toBe(true);
  expect(heldPose('up', 1).angle).toBe(-90);
  expect(heldPose('down', 1).angle).toBe(90);
});
