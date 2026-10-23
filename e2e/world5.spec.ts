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

test.describe('世界 5 火山島', () => {
  for (const level of ['w5-1', 'w5-2', 'w5-3']) {
    test(`${level} 有圖、沒有缺圖`, async ({ page }) => {
      await open(page, level);
      const s = await gk(page);
      expect(s.level).toBe(level);
      expect(s.art!.missing).toEqual([]);
      expect(s.music).toBe(level === 'w5-1' ? 'day' : level === 'w5-2' ? 'dusk' : 'night');
    });
  }

  test('踩到熔岩會燙到、往上彈', async ({ page }) => {
    await open(page, 'w5-1');
    await page.evaluate(() => window.__GK__!.warp!(1145));
    await calm(page);
    await page.waitForFunction(() => window.__GK__!.volcano!.lavaBurns > 0, undefined, { timeout: 3000 });
  });

  test('站在熔岩旁邊的沙灘上不會燙到', async ({ page }) => {
    await open(page, 'w5-1');
    await page.evaluate(() => window.__GK__!.warp!(1300));
    await calm(page);
    await page.waitForTimeout(1500);
    expect((await gk(page)).volcano!.lavaBurns).toBe(0);
  });

  test('走進噴發區,火山噴發掉石頭,落地就碎掉', async ({ page }) => {
    await open(page, 'w5-1');
    await page.evaluate(() => window.__GK__!.warp!(8500));
    await calm(page);
    await page.waitForFunction(() => window.__GK__!.desert!.blocks > 0, undefined, { timeout: 3000 });
    expect((await gk(page)).volcano!.eruptions).toBeGreaterThan(0);
    // 走出噴發區(往前),石頭落地碎掉(不留下來),之後不再噴發。
    await page.evaluate(() => window.__GK__!.warp!(9050));
    await page.waitForFunction(() => window.__GK__!.desert!.blocks === 0, undefined, { timeout: 4000 });
    const n = (await gk(page)).volcano!.eruptions;
    await page.waitForTimeout(3500);
    expect((await gk(page)).volcano!.eruptions).toBe(n);
  });

  for (const [level, boss] of [
    ['w5-1', 'hippo'],
    ['w5-2', 'snail'],
    ['w5-3', 'dragon'],
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

  test('溫泉河馬噴蒸氣、跳起來送出震波', async ({ page }) => {
    await open(page, 'w5-1');
    await page.evaluate(() => window.__GK__!.warp!(9700));
    await page.waitForFunction(() => window.__GK__!.boss?.type === 'hippo', undefined, { timeout: 8000 });
    await page.waitForFunction(() => (window.__GK__!.enemyShots ?? 0) > 0, undefined, { timeout: 8000 });
    await page.waitForFunction(() => window.__GK__!.desert!.waves > 0, undefined, { timeout: 8000 });
  });

  test('火山蝸牛噴熔岩球時縮進殼裡,子彈打不動', async ({ page }) => {
    await open(page, 'w5-2');
    await page.evaluate(() => window.__GK__!.warp!(9700));
    await page.waitForFunction(() => window.__GK__!.boss?.type === 'snail', undefined, { timeout: 8000 });
    // 面向右邊(蝸牛那邊)。
    await page.keyboard.down('KeyD');
    await page.waitForTimeout(100);
    await page.keyboard.up('KeyD');
    await page.waitForFunction(() => window.__GK__!.boss?.armored === true, undefined, { timeout: 10000 });
    expect((await gk(page)).enemyShots).toBeGreaterThan(0);
    const before = (await gk(page)).blockedShots ?? 0;
    await page.keyboard.down('KeyC');
    await page.waitForFunction((b) => (window.__GK__!.blockedShots ?? 0) > b, before, { timeout: 1500 });
    await page.keyboard.up('KeyC');
  });

  test('火龍換階段、會出招', async ({ page }) => {
    await open(page, 'w5-3');
    await page.evaluate(() => window.__GK__!.warp!(9700));
    await page.waitForFunction(() => window.__GK__!.boss?.type === 'dragon', undefined, { timeout: 8000 });
    await page.evaluate(() => window.__GK__!.hurtBoss!(105));
    await page.waitForFunction(() => window.__GK__!.boss!.phase === 2, undefined, { timeout: 3000 });
    // 第二階段的圖真的畫出來(不會被換回第一階段)。
    await page.waitForTimeout(300);
    expect((await gk(page)).enemies!.find((e) => e.type === 'dragon')!.artKey).toMatch(/^(dragon-2|w5-fire-dragon-boss-phase2-)/);
    await page.waitForFunction(() => (window.__GK__!.enemyShots ?? 0) > 0 || window.__GK__!.desert!.blocks > 0, undefined, { timeout: 8000 });
  });
});

test('選關:通過 4-3 才開放世界 5', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.removeItem('gk.test.v1');
    const all = ['w1-1', 'w1-2', 'forest', 'w2-1', 'w2-2', 'w2-3', 'w3-1', 'w3-2', 'w3-3', 'w4-1', 'w4-2', 'w4-3'];
    localStorage.setItem('gk.save.v1', JSON.stringify({ version: 1, weapons: {}, cleared: Object.fromEntries(all.map((id) => [id, 1])) }));
  });
  await page.goto('./?test=1');
  await page.waitForFunction(() => window.__GK__?.screen === 'mode-select', undefined, { timeout: 15000 });
  await page.locator('canvas').click({ position: { x: 5, y: 5 } });
  await page.keyboard.press('Digit1');
  await page.waitForFunction(() => window.__GK__!.screen === 'level-select');
  const s = await gk(page);
  expect(s.world).toBe(5);
  expect(s.levels!.map((l) => [l.id, l.unlocked])).toEqual([
    ['w5-1', true],
    ['w5-2', false],
    ['w5-3', false],
  ]);
});
