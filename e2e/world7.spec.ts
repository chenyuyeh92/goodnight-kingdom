import { test, expect, type Page } from '@playwright/test';

async function gk(page: Page) {
  return page.evaluate(() => window.__GK__!);
}

async function open(page: Page, level: string, mode = 'single'): Promise<void> {
  await page.goto(`./?mode=${mode}&test=1&level=${level}`);
  await page.waitForFunction(() => window.__GK__?.screen === 'range', undefined, { timeout: 30000 });
  await page.locator('canvas').click({ position: { x: 5, y: 5 } });
}

async function calm(page: Page): Promise<void> {
  await page.evaluate(() => window.__GK__!.defeatAll!());
}

test.describe('世界 7 非洲大草原', () => {
  for (const level of ['w7-1', 'w7-2', 'w7-3']) {
    test(`${level} 有圖、沒有缺圖`, async ({ page }) => {
      await open(page, level);
      const s = await gk(page);
      expect(s.level).toBe(level);
      expect(s.art!.missing).toEqual([]);
      expect(s.music).toBe(level === 'w7-1' ? 'day' : level === 'w7-2' ? 'dusk' : 'night');
    });
  }

  test('走進奔跑區:先預告,角馬群衝過來,站在地上不動會被撞到', async ({ page }) => {
    await open(page, 'w7-1');
    // 奔跑區 1300–1900。
    await page.evaluate(() => window.__GK__!.warp!(1350));
    await calm(page);
    await page.waitForFunction(() => window.__GK__!.stampede!.warnings > 0, undefined, { timeout: 4000 });
    expect((await gk(page)).stampede!.beasts).toBe(0);
    await page.waitForFunction(() => window.__GK__!.stampede!.beasts > 0, undefined, { timeout: 3000 });
    await page.waitForFunction(() => window.__GK__!.stampede!.hits > 0, undefined, { timeout: 5000 });
    // 跑過去之後收掉。
    await page.waitForFunction(() => window.__GK__!.stampede!.beasts === 0, undefined, { timeout: 8000 });
  });

  test('不在奔跑區裡不會有獸群', async ({ page }) => {
    await open(page, 'w7-1');
    await page.evaluate(() => window.__GK__!.warp!(2400));
    await calm(page);
    await page.waitForTimeout(4000);
    expect((await gk(page)).stampede!.herds).toBe(0);
  });

  test('熬夜狐獴跑一段會躲進地洞', async ({ page }) => {
    await open(page, 'w7-1');
    await page.evaluate(() => window.__GK__!.warp!(2400));
    await calm(page);
    await page.evaluate(() => window.__GK__!.spawn!('meerkat', 2900));
    await page.waitForFunction(() => window.__GK__!.enemies!.some((e) => e.type === 'meerkat' && e.phase === 'burrow'), undefined, { timeout: 5000 });
  });

  for (const [level, boss] of [
    ['w7-1', 'giraffe'],
    ['w7-2', 'elephant'],
    ['w7-3', 'lion'],
  ] as const) {
    test(`${level} ${boss} 打得倒,通關存檔`, async ({ page }) => {
      await page.addInitScript(() => localStorage.removeItem('gk.save.v1'));
      await open(page, level);
      await page.evaluate(() => window.__GK__!.warp!(9700));
      await page.waitForFunction((b) => window.__GK__!.boss?.type === b, boss, { timeout: 8000 });
      await page.waitForTimeout(2500);
      await page.evaluate(() => window.__GK__!.hurtBoss!(9999));
      await page.waitForFunction(() => window.__GK__!.screen === 'complete', undefined, { timeout: 8000 });
      const save = await page.evaluate(() => JSON.parse(localStorage.getItem('gk.save.v1')!));
      expect(save.cleared[level]).toBeGreaterThan(0);
    });
  }

  test('失眠長頸鹿用脖子橫掃', async ({ page }) => {
    await open(page, 'w7-1');
    await page.evaluate(() => window.__GK__!.warp!(9700));
    await page.waitForFunction(() => window.__GK__!.boss?.type === 'giraffe', undefined, { timeout: 8000 });
    await page.evaluate(() => window.__GK__!.warp!(9350));
    await page.waitForFunction(() => (window.__GK__!.enemyShots ?? 0) > 0, undefined, { timeout: 8000 });
  });

  test('熬夜大象噴水柱、跺腳送出震波', async ({ page }) => {
    await open(page, 'w7-2');
    await page.evaluate(() => window.__GK__!.warp!(9700));
    await page.waitForFunction(() => window.__GK__!.boss?.type === 'elephant', undefined, { timeout: 8000 });
    await page.evaluate(() => window.__GK__!.warp!(9350));
    await page.waitForFunction(() => (window.__GK__!.enemyShots ?? 0) > 0, undefined, { timeout: 8000 });
    await page.waitForFunction(() => window.__GK__!.desert!.waves > 0, undefined, { timeout: 10000 });
  });

  test('獅子王換階段後會叫角馬群', async ({ page }) => {
    await open(page, 'w7-3');
    await page.evaluate(() => window.__GK__!.warp!(9700));
    await page.waitForFunction(() => window.__GK__!.boss?.type === 'lion', undefined, { timeout: 8000 });
    await page.evaluate(() => window.__GK__!.hurtBoss!(135));
    await page.waitForFunction(() => window.__GK__!.boss!.phase === 2, undefined, { timeout: 3000 });
    await page.waitForTimeout(300);
    expect((await gk(page)).enemies!.find((e) => e.type === 'lion')!.artKey).toMatch(/^(lion-2|w7-lion-king-boss-phase2-)/);
    await page.waitForFunction(() => window.__GK__!.stampede!.herds > 0, undefined, { timeout: 15000 });
  });
});

test('選關:通過 6-3 才開放世界 7', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.removeItem('gk.test.v1');
    const all = ['w1-1', 'w1-2', 'forest', 'w2-1', 'w2-2', 'w2-3', 'w3-1', 'w3-2', 'w3-3', 'w4-1', 'w4-2', 'w4-3', 'w5-1', 'w5-2', 'w5-3', 'w6-1', 'w6-2', 'w6-3'];
    localStorage.setItem('gk.save.v1', JSON.stringify({ version: 1, weapons: {}, cleared: Object.fromEntries(all.map((id) => [id, 1])) }));
  });
  await page.goto('./?test=1');
  await page.waitForFunction(() => window.__GK__?.screen === 'mode-select', undefined, { timeout: 15000 });
  await page.locator('canvas').click({ position: { x: 5, y: 5 } });
  await page.keyboard.press('Digit1');
  await page.waitForFunction(() => window.__GK__!.screen === 'level-select');
  const s = await gk(page);
  expect(s.world).toBe(7);
  expect(s.levels!.map((l) => [l.id, l.unlocked])).toEqual([
    ['w7-1', true],
    ['w7-2', false],
    ['w7-3', false],
  ]);
});
