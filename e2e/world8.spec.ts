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

test.describe('世界 8 雲端高山', () => {
  for (const level of ['w8-1', 'w8-2', 'w8-3']) {
    test(`${level} 有圖、沒有缺圖`, async ({ page }) => {
      await open(page, level);
      const s = await gk(page);
      expect(s.level).toBe(level);
      expect(s.art!.missing).toEqual([]);
      expect(s.music).toBe(level === 'w8-1' ? 'day' : level === 'w8-2' ? 'dusk' : 'night');
    });
  }

  test('在強風區裡站著不動會被風往回推', async ({ page }) => {
    await open(page, 'w8-1');
    // 強風區 1300–2100。
    await page.evaluate(() => window.__GK__!.warp!(1900));
    await calm(page);
    await page.waitForFunction(() => window.__GK__!.wind!.strength === 1, undefined, { timeout: 5000 });
    const x0 = (await gk(page)).players![0].x;
    await page.waitForTimeout(600);
    expect((await gk(page)).players![0].x).toBeLessThan(x0 - 30);
  });

  test('逆風還是走得過去', async ({ page }) => {
    await open(page, 'w8-1');
    await page.evaluate(() => window.__GK__!.warp!(1400));
    await calm(page);
    await page.keyboard.down('KeyD');
    await page.waitForFunction(() => window.__GK__!.players![0].x > 2150, undefined, { timeout: 15000 });
    await page.keyboard.up('KeyD');
  });

  test('掉進雲海扣愛心、從邊上重新出來', async ({ page }) => {
    await open(page, 'w8-2');
    // 雲海 1000–1300,沒踩雲朵平台直接走過去。
    await page.evaluate(() => window.__GK__!.warp!(950));
    await calm(page);
    await page.keyboard.down('KeyD');
    await page.waitForFunction(() => window.__GK__!.riverFalls === 1, undefined, { timeout: 4000 });
    await page.keyboard.up('KeyD');
    expect((await gk(page)).players![0].x).toBeLessThan(1000);
  });

  for (const [level, boss] of [
    ['w8-1', 'goat'],
    ['w8-2', 'panda'],
    ['w8-3', 'thunderbird'],
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

  test('熬夜山羊衝到山壁,頭暈、山上滾下石頭', async ({ page }) => {
    await open(page, 'w8-1');
    await page.evaluate(() => window.__GK__!.warp!(9700));
    await page.waitForFunction(() => window.__GK__!.boss?.type === 'goat', undefined, { timeout: 8000 });
    await page.evaluate(() => window.__GK__!.warp!(9350));
    await page.waitForFunction(() => window.__GK__!.boss?.mode === 'dizzy', undefined, { timeout: 10000 });
    await page.waitForFunction(() => window.__GK__!.desert!.blocks > 0, undefined, { timeout: 3000 });
  });

  test('失眠熊貓丟迴旋竹子', async ({ page }) => {
    await open(page, 'w8-2');
    await page.evaluate(() => window.__GK__!.warp!(9700));
    await page.waitForFunction(() => window.__GK__!.boss?.type === 'panda', undefined, { timeout: 8000 });
    await page.waitForFunction(() => window.__GK__!.boss?.mode === 'roll', undefined, { timeout: 8000 });
    await page.waitForFunction(() => (window.__GK__!.enemyShots ?? 0) > 0, undefined, { timeout: 10000 });
  });

  test('熬夜雷鳥換階段、颳強風、召喚落雷', async ({ page }) => {
    await open(page, 'w8-3');
    await page.evaluate(() => window.__GK__!.warp!(9700));
    await page.waitForFunction(() => window.__GK__!.boss?.type === 'thunderbird', undefined, { timeout: 8000 });
    await page.waitForFunction(() => window.__GK__!.desert!.blocks > 0, undefined, { timeout: 8000 });
    await page.waitForFunction(() => window.__GK__!.wind!.gust, undefined, { timeout: 8000 });
    await page.evaluate(() => window.__GK__!.hurtBoss!(135));
    await page.waitForFunction(() => window.__GK__!.boss!.phase === 2, undefined, { timeout: 4000 });
    await page.waitForTimeout(300);
    expect((await gk(page)).enemies!.find((e) => e.type === 'thunderbird')!.artKey).toMatch(/^(thunderbird-2|w8-thunderbird-boss-phase2-)/);
  });
});

test('選關:通過 7-3 才開放世界 8', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.removeItem('gk.test.v1');
    const all = ['w1-1', 'w1-2', 'forest'];
    for (let w = 2; w <= 7; w++) for (let l = 1; l <= 3; l++) all.push(`w${w}-${l}`);
    localStorage.setItem('gk.save.v1', JSON.stringify({ version: 1, weapons: {}, cleared: Object.fromEntries(all.map((id) => [id, 1])) }));
  });
  await page.goto('./?test=1');
  await page.waitForFunction(() => window.__GK__?.screen === 'mode-select', undefined, { timeout: 15000 });
  await page.locator('canvas').click({ position: { x: 5, y: 5 } });
  await page.keyboard.press('Digit1');
  await page.waitForFunction(() => window.__GK__!.screen === 'level-select');
  const s = await gk(page);
  expect(s.world).toBe(8);
  expect(s.levels!.map((l) => [l.id, l.unlocked])).toEqual([
    ['w8-1', true],
    ['w8-2', false],
    ['w8-3', false],
  ]);
});
