import { test, expect } from 'vitest';
import { applyHit, freshHealth, tickHealth, type Health } from '../src/game/health';

function tickAway(h: Health, ms: number): Health {
  for (let t = 0; t < ms; t += 40) h = tickHealth(h, 40);
  return h;
}

function hitAndWait(h: Health): Health {
  return tickAway(applyHit(h).health, 1000);
}

test('被打中扣一顆並無敵 1000ms', () => {
  const r = applyHit(freshHealth());
  expect(r.health.hearts).toBe(2);
  expect(r.health.invulnMs).toBe(1000);
  expect(r.hit).toBe(true);
});

test('無敵期間不扣', () => {
  const first = applyHit(freshHealth());
  const second = applyHit(first.health);
  expect(second.health.hearts).toBe(2);
  expect(second.hit).toBe(false);
});

test('無敵結束後可以再扣', () => {
  const h = hitAndWait(freshHealth());
  expect(applyHit(h).health.hearts).toBe(1);
});

test('第三次被打會睡著', () => {
  const h = hitAndWait(hitAndWait(freshHealth()));
  const r = applyHit(h);
  expect(r.health.down).toBe(true);
  expect(r.health.hearts).toBe(0);
  expect(r.wentDown).toBe(true);
});

test('睡著時不會再被打', () => {
  const down: Health = { hearts: 0, invulnMs: 0, down: true, downMs: 10 };
  const r = applyHit(down);
  expect(r.hit).toBe(false);
  expect(r.health).toEqual(down);
});

test('睡著時 downMs 會累加,dt 夾到 50', () => {
  const down: Health = { hearts: 0, invulnMs: 0, down: true, downMs: 0 };
  expect(tickHealth(down, 5000).downMs).toBe(50);
});

test('freshHealth(1500) 帶復活無敵', () => {
  expect(freshHealth(1500)).toEqual({ hearts: 3, invulnMs: 1500, down: false, downMs: 0 });
});
