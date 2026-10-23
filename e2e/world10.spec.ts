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

async function toBoss(page: Page, level: string, boss: string): Promise<void> {
  await open(page, level);
  await page.evaluate(() => window.__GK__!.warp!(9700));
  await page.waitForFunction((b) => window.__GK__!.boss?.type === b, boss, { timeout: 8000 });
}

test.describe('世界 10 月亮城堡', () => {
  for (const level of ['w10-1', 'w10-2', 'w10-3']) {
    test(`${level} 有圖、沒有缺圖,有 10 顆星星`, async ({ page }) => {
      await open(page, level);
      const s = await gk(page);
      expect(s.level).toBe(level);
      expect(s.art!.missing).toEqual([]);
      expect(s.music).toBe(level === 'w10-1' ? 'day' : level === 'w10-2' ? 'dusk' : 'night');
      expect(s.w10!.starsTotal).toBe(10);
      expect(s.w10!.stars).toBe(0);
    });
  }

  test('10-1 碰到星星就收集', async ({ page }) => {
    await open(page, 'w10-1');
    await page.evaluate(() => window.__GK__!.warp!(450));
    await page.waitForFunction(() => window.__GK__!.w10!.stars === 1, undefined, { timeout: 4000 });
  });

  test('10-3 大廳是暗的、燭台有光;王座不暗', async ({ page }) => {
    await open(page, 'w10-3');
    await page.evaluate(() => window.__GK__!.warp!(3000));
    await calm(page);
    await page.waitForFunction(() => window.__GK__!.darkness!.alpha > 0.85, undefined, { timeout: 4000 });
    expect((await gk(page)).darkness!.lights).toBeGreaterThanOrEqual(3);
    await page.evaluate(() => window.__GK__!.warp!(9700));
    await page.waitForFunction(() => window.__GK__!.darkness!.alpha === 0, undefined, { timeout: 6000 });
  });

  for (const [level, boss] of [
    ['w10-1', 'rabbit'],
    ['w10-2', 'peacock'],
  ] as const) {
    test(`${level} ${boss} 打得倒,通關存檔`, async ({ page }) => {
      await page.addInitScript(() => localStorage.removeItem('gk.save.v1'));
      await toBoss(page, level, boss);
      await page.waitForTimeout(2500);
      await page.evaluate(() => window.__GK__!.hurtBoss!(9999));
      await page.waitForFunction(() => window.__GK__!.screen === 'complete', undefined, { timeout: 8000 });
      const s = await gk(page);
      expect(s.ending).toBe(false);
      expect(s.summary).toContain('收集星星 0 / 10');
      const save = await page.evaluate(() => JSON.parse(localStorage.getItem('gk.save.v1')!));
      expect(save.cleared[level]).toBeGreaterThan(0);
    });
  }

  test('月兔丟的麻糬黏到會變慢', async ({ page }) => {
    await toBoss(page, 'w10-1', 'rabbit');
    await page.waitForFunction(() => window.__GK__!.w10!.mochiHits > 0, undefined, { timeout: 15000 });
  });

  test('孔雀開屏後左右顛倒:按右往左走', async ({ page }) => {
    await toBoss(page, 'w10-2', 'peacock');
    await page.waitForFunction(() => window.__GK__!.w10!.reversed, undefined, { timeout: 8000 });
    const x0 = (await gk(page)).players![0].x;
    await page.keyboard.down('KeyD');
    await page.waitForTimeout(400);
    await page.keyboard.up('KeyD');
    expect((await gk(page)).players![0].x).toBeLessThan(x0 - 20);
  });

  test('夢貘用鼻子把玩家吸過去,換階段變大、叫手下', async ({ page }) => {
    await toBoss(page, 'w10-3', 'tapir');
    await page.waitForFunction(() => window.__GK__!.w10!.inhaling, undefined, { timeout: 15000 });
    const x0 = (await gk(page)).players![0].x;
    await page.waitForTimeout(400);
    expect((await gk(page)).players![0].x).toBeGreaterThan(x0 + 20);
    await page.evaluate(() => window.__GK__!.hurtBoss!(60));
    await page.waitForFunction(() => window.__GK__!.boss!.phase === 2, undefined, { timeout: 3000 });
    await page.waitForTimeout(300);
    expect((await gk(page)).enemies!.find((e) => e.type === 'tapir')!.artKey).toMatch(/^(tapir-2|w10-dream-tapir-boss-phase2)/);
    await page.waitForFunction(() => window.__GK__!.enemies!.some((e) => e.type === 'pillowSoldier' || e.type === 'noisyStar'), undefined, { timeout: 15000 });
  });

  for (const inMoon of [false, true]) {
    test(`夢貘換階段放大惡夢:${inMoon ? '躲進月光不扣愛心' : '沒躲扣 3 顆愛心'}`, async ({ page }) => {
      await toBoss(page, 'w10-3', 'tapir');
      await page.evaluate(() => window.__GK__!.hurtBoss!(60));
      await page.waitForFunction(() => window.__GK__!.w10!.nightmare !== null, undefined, { timeout: 4000 });
      const { safeX, halfW } = (await gk(page)).w10!.nightmare!;
      await page.evaluate((x) => window.__GK__!.warp!(x), inMoon ? safeX : safeX + (safeX < 9550 ? 1 : -1) * (halfW + 120));
      const hearts = (await gk(page)).players![0].hearts;
      await page.waitForFunction(() => window.__GK__!.w10!.nightmare === null, undefined, { timeout: 5000 });
      await page.waitForTimeout(100);
      const s = await gk(page);
      expect(s.w10!.nightmareHits).toBe(inMoon ? 0 : 1);
      expect(s.players![0].hearts).toBe(inMoon ? hearts : hearts - 3);
    });
  }

  test('打倒夢貘就是破關:結算畫面變成結局', async ({ page }) => {
    await page.addInitScript(() => localStorage.removeItem('gk.save.v1'));
    await toBoss(page, 'w10-3', 'tapir');
    await page.waitForTimeout(2500);
    await page.evaluate(() => window.__GK__!.hurtBoss!(9999));
    await page.waitForFunction(() => window.__GK__!.screen === 'complete', undefined, { timeout: 8000 });
    const s = await gk(page);
    expect(s.ending).toBe(true);
    const save = await page.evaluate(() => JSON.parse(localStorage.getItem('gk.save.v1')!));
    expect(save.cleared['w10-3']).toBeGreaterThan(0);
  });
});

test('選關:通過 9-3 才開放世界 10', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.removeItem('gk.test.v1');
    const all = ['w1-1', 'w1-2', 'forest'];
    for (let w = 2; w <= 9; w++) for (let l = 1; l <= 3; l++) all.push(`w${w}-${l}`);
    localStorage.setItem('gk.save.v1', JSON.stringify({ version: 1, weapons: {}, cleared: Object.fromEntries(all.map((id) => [id, 1])) }));
  });
  await page.goto('./?test=1');
  await page.waitForFunction(() => window.__GK__?.screen === 'mode-select', undefined, { timeout: 15000 });
  await page.locator('canvas').click({ position: { x: 5, y: 5 } });
  await page.keyboard.press('Digit1');
  await page.waitForFunction(() => window.__GK__!.screen === 'level-select');
  const s = await gk(page);
  expect(s.world).toBe(10);
  expect(s.levels!.map((l) => [l.id, l.unlocked])).toEqual([
    ['w10-1', true],
    ['w10-2', false],
    ['w10-3', false],
  ]);
});
