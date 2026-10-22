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

test.describe('世界 6 熱帶雨林', () => {
  for (const level of ['w6-1', 'w6-2', 'w6-3']) {
    test(`${level} 有圖、沒有缺圖`, async ({ page }) => {
      await open(page, level);
      const s = await gk(page);
      expect(s.level).toBe(level);
      expect(s.art!.missing).toEqual([]);
      expect(s.music).toBe(level === 'w6-1' ? 'day' : level === 'w6-2' ? 'dusk' : 'night');
    });
  }

  test('從岸邊跳起來抓住藤蔓,按跳躍放手飛過河', async ({ page }) => {
    await open(page, 'w6-1');
    // 第一條寬河溝 1700–1960,藤蔓在 1770。
    await page.evaluate(() => window.__GK__!.warp!(1650));
    await calm(page);
    await page.waitForTimeout(300);
    await page.keyboard.down('KeyD');
    await page.keyboard.down('KeyV');
    await page.waitForFunction(() => window.__GK__!.vines!.holding[0] !== null, undefined, { timeout: 2000 });
    await page.keyboard.up('KeyV');
    await page.keyboard.up('KeyD');
    expect((await gk(page)).vines!.grabs).toBe(1);
    // 盪一下,往右盪的時候放手。
    await page.waitForTimeout(250);
    await page.keyboard.press('KeyV');
    await page.waitForFunction(() => window.__GK__!.vines!.holding[0] === null, undefined, { timeout: 1000 });
    await page.waitForTimeout(1500);
    const s = await gk(page);
    expect(s.riverFalls).toBe(0);
    expect(s.players![0].x).toBeGreaterThan(1960);
  });

  test('沒抓藤蔓直接走進寬河溝會掉下去,從岸邊重新出來', async ({ page }) => {
    await open(page, 'w6-1');
    await page.evaluate(() => window.__GK__!.warp!(1650));
    await calm(page);
    await page.keyboard.down('KeyD');
    await page.waitForFunction(() => window.__GK__!.riverFalls === 1, undefined, { timeout: 4000 });
    await page.keyboard.up('KeyD');
    expect((await gk(page)).players![0].x).toBeLessThan(1700);
  });

  test('咖啡變色龍走一走會躲起來(變透明)', async ({ page }) => {
    await open(page, 'w6-1');
    await page.evaluate(() => window.__GK__!.warp!(600));
    await calm(page);
    await page.evaluate(() => window.__GK__!.spawn!('chameleon', 1000));
    await page.waitForFunction(() => window.__GK__!.enemies!.some((e) => e.type === 'chameleon' && e.phase === 'hide'), undefined, { timeout: 5000 });
  });

  for (const [level, boss] of [
    ['w6-1', 'sloth'],
    ['w6-2', 'jaguar'],
    ['w6-3', 'gorilla'],
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

  test('失眠樹懶搖樹讓芒果掉下來', async ({ page }) => {
    await open(page, 'w6-1');
    await page.evaluate(() => window.__GK__!.warp!(9700));
    await page.waitForFunction(() => window.__GK__!.boss?.type === 'sloth', undefined, { timeout: 8000 });
    // 離遠一點,樹懶才不會一直用爪子掃。
    await page.evaluate(() => window.__GK__!.warp!(9300));
    await page.waitForFunction(() => window.__GK__!.desert!.blocks > 0, undefined, { timeout: 8000 });
  });

  test('熬夜美洲豹跳上樹躲起來(打不到),再撲下來', async ({ page }) => {
    await open(page, 'w6-2');
    await page.evaluate(() => window.__GK__!.warp!(9700));
    await page.waitForFunction(() => window.__GK__!.boss?.hidden === true, undefined, { timeout: 12000 });
    await page.waitForFunction(() => window.__GK__!.boss?.mode === 'dizzy', undefined, { timeout: 6000 });
  });

  test('大猩猩換階段、會出招', async ({ page }) => {
    await open(page, 'w6-3');
    await page.evaluate(() => window.__GK__!.warp!(9700));
    await page.waitForFunction(() => window.__GK__!.boss?.type === 'gorilla', undefined, { timeout: 8000 });
    await page.evaluate(() => window.__GK__!.hurtBoss!(40));
    await page.waitForFunction(() => window.__GK__!.boss!.phase === 2, undefined, { timeout: 3000 });
    await page.waitForTimeout(300);
    expect((await gk(page)).enemies!.find((e) => e.type === 'gorilla')!.artKey).toMatch(/^(gorilla-2|w6-gorilla-boss-phase2-)/);
    await page.waitForFunction(() => (window.__GK__!.enemyShots ?? 0) > 0 || window.__GK__!.desert!.blocks > 0, undefined, { timeout: 8000 });
  });
});

test('選關:通過 5-3 才開放世界 6', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.removeItem('gk.test.v1');
    const all = ['w1-1', 'w1-2', 'forest', 'w2-1', 'w2-2', 'w2-3', 'w3-1', 'w3-2', 'w3-3', 'w4-1', 'w4-2', 'w4-3', 'w5-1', 'w5-2', 'w5-3'];
    localStorage.setItem('gk.save.v1', JSON.stringify({ version: 1, weapons: {}, cleared: Object.fromEntries(all.map((id) => [id, 1])) }));
  });
  await page.goto('./?test=1');
  await page.waitForFunction(() => window.__GK__?.screen === 'mode-select', undefined, { timeout: 15000 });
  await page.locator('canvas').click({ position: { x: 5, y: 5 } });
  await page.keyboard.press('Digit1');
  await page.waitForFunction(() => window.__GK__!.screen === 'level-select');
  const s = await gk(page);
  expect(s.world).toBe(6);
  expect(s.levels!.map((l) => [l.id, l.unlocked])).toEqual([
    ['w6-1', true],
    ['w6-2', false],
    ['w6-3', false],
  ]);
});
