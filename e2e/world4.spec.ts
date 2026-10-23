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

test.describe('世界 4 冰雪極地', () => {
  for (const level of ['w4-1', 'w4-2', 'w4-3']) {
    test(`${level} 有圖、沒有缺圖`, async ({ page }) => {
      await open(page, level);
      const s = await gk(page);
      expect(s.level).toBe(level);
      expect(s.art!.missing).toEqual([]);
      expect(s.music).toBe(level === 'w4-1' ? 'day' : level === 'w4-2' ? 'dusk' : 'night');
    });
  }

  test('冰面上放開會滑一段,雪地上馬上停', async ({ page }) => {
    await open(page, 'w4-2');
    const slide = async (x: number): Promise<number> => {
      await page.evaluate((px) => window.__GK__!.warp!(px), x);
      await calm(page);
      await page.waitForTimeout(300);
      await page.keyboard.down('KeyD');
      await page.waitForTimeout(900);
      await page.keyboard.up('KeyD');
      const x0 = (await gk(page)).players![0].x;
      await page.waitForTimeout(700);
      return (await gk(page)).players![0].x - x0;
    };
    const onIce = await slide(2320);
    const onSnow = await slide(5700);
    // 放開按鍵要到下一格才生效,雪地上也會多走一格(約 12 px)。
    expect(onSnow).toBeLessThan(25);
    expect(onIce).toBeGreaterThan(onSnow * 3);
  });

  test('走到冰柱附近,冰柱掉下來', async ({ page }) => {
    await open(page, 'w4-1');
    await page.evaluate(() => window.__GK__!.warp!(1650));
    await calm(page);
    await page.keyboard.down('KeyD');
    await page.waitForFunction(() => window.__GK__!.desert!.blocks > 0, undefined, { timeout: 3000 });
    await page.keyboard.up('KeyD');
    // 冰柱落地就碎掉,不會留下來當平台。
    await page.waitForFunction(() => window.__GK__!.desert!.blocks === 0, undefined, { timeout: 4000 });
    expect((await gk(page)).desert!.landed).toBe(0);
  });

  for (const [level, boss] of [
    ['w4-1', 'polarBear'],
    ['w4-2', 'narwhal'],
    ['w4-3', 'yeti'],
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

  test('北極熊拍地會掉冰柱', async ({ page }) => {
    await open(page, 'w4-1');
    await page.evaluate(() => window.__GK__!.warp!(9700));
    await page.waitForFunction(() => window.__GK__!.boss?.type === 'polarBear', undefined, { timeout: 8000 });
    await page.waitForFunction(() => window.__GK__!.desert!.blocks > 0, undefined, { timeout: 10000 });
  });

  test('獨角鯨潛到冰面下時打不到', async ({ page }) => {
    await open(page, 'w4-2');
    await page.evaluate(() => window.__GK__!.warp!(9700));
    await page.waitForFunction(() => window.__GK__!.boss?.hidden === true, undefined, { timeout: 10000 });
  });

  test('雪怪換階段、會出招', async ({ page }) => {
    await open(page, 'w4-3');
    await page.evaluate(() => window.__GK__!.warp!(9700));
    await page.waitForFunction(() => window.__GK__!.boss?.type === 'yeti', undefined, { timeout: 8000 });
    await page.evaluate(() => window.__GK__!.hurtBoss!(105));
    await page.waitForFunction(() => window.__GK__!.boss!.phase === 2, undefined, { timeout: 3000 });
    // 第二階段的圖真的畫出來(不會被換回第一階段)。
    await page.waitForTimeout(300);
    expect((await gk(page)).enemies!.find((e) => e.type === 'yeti')!.artKey).toMatch(/^(yeti-2|w4-yeti-boss-phase2-)/);
    await page.waitForFunction(() => (window.__GK__!.enemyShots ?? 0) > 0 || window.__GK__!.desert!.blocks > 0, undefined, { timeout: 8000 });
  });
});

test('選關:通過 3-3 才開放世界 4', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.removeItem('gk.test.v1');
    const all = ['w1-1', 'w1-2', 'forest', 'w2-1', 'w2-2', 'w2-3', 'w3-1', 'w3-2', 'w3-3'];
    localStorage.setItem('gk.save.v1', JSON.stringify({ version: 1, weapons: {}, cleared: Object.fromEntries(all.map((id) => [id, 1])) }));
  });
  await page.goto('./?test=1');
  await page.waitForFunction(() => window.__GK__?.screen === 'mode-select', undefined, { timeout: 15000 });
  await page.locator('canvas').click({ position: { x: 5, y: 5 } });
  await page.keyboard.press('Digit1');
  await page.waitForFunction(() => window.__GK__!.screen === 'level-select');
  const s = await gk(page);
  expect(s.world).toBe(4);
  expect(s.levels!.map((l) => [l.id, l.unlocked])).toEqual([
    ['w4-1', true],
    ['w4-2', false],
    ['w4-3', false],
  ]);
});
