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

test.describe('世界 9 地底洞窟', () => {
  for (const level of ['w9-1', 'w9-2', 'w9-3']) {
    test(`${level} 有圖、沒有缺圖`, async ({ page }) => {
      await open(page, level);
      const s = await gk(page);
      expect(s.level).toBe(level);
      expect(s.art!.missing).toEqual([]);
      expect(s.music).toBe(level === 'w9-1' ? 'w09-day' : level === 'w9-2' ? 'w09-dusk' : 'w09-night');
    });
  }

  test('9-1 前半段亮,走進礦坑變暗,身邊和水晶附近有光', async ({ page }) => {
    await open(page, 'w9-1');
    await page.waitForTimeout(500);
    expect((await gk(page)).darkness!.alpha).toBe(0);
    await page.evaluate(() => window.__GK__!.warp!(5600));
    await calm(page);
    await page.waitForFunction(() => window.__GK__!.darkness!.alpha > 0.85, undefined, { timeout: 4000 });
    // 玩家自己加上畫面裡的水晶。
    expect((await gk(page)).darkness!.lights).toBeGreaterThanOrEqual(3);
  });

  test('9-2 一開始就是暗的', async ({ page }) => {
    await open(page, 'w9-2');
    await page.waitForFunction(() => window.__GK__!.darkness!.alpha > 0.85, undefined, { timeout: 4000 });
  });

  for (const [level, boss] of [
    ['w9-1', 'queen'],
    ['w9-2', 'axolotl'],
    ['w9-3', 'mole'],
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

  test('螢火蟲女王叫出會發光的小螢火蟲,燈泡一閃後四周很黑', async ({ page }) => {
    await open(page, 'w9-1');
    await page.evaluate(() => window.__GK__!.warp!(9700));
    await page.waitForFunction(() => window.__GK__!.boss?.type === 'queen', undefined, { timeout: 8000 });
    await page.waitForFunction(() => window.__GK__!.enemies!.some((e) => e.type === 'firefly'), undefined, { timeout: 8000 });
    await page.waitForFunction(() => window.__GK__!.darkness!.blackout, undefined, { timeout: 12000 });
  });

  test('六角恐龍一陣子沒被打會回血', async ({ page }) => {
    await open(page, 'w9-2');
    await page.evaluate(() => window.__GK__!.warp!(9700));
    await page.waitForFunction(() => window.__GK__!.boss?.type === 'axolotl', undefined, { timeout: 8000 });
    await page.evaluate(() => window.__GK__!.hurtBoss!(60));
    const hp = (await gk(page)).boss!.hp;
    await page.waitForFunction((h) => window.__GK__!.boss!.hp > h, hp, { timeout: 6000 });
  });

  test('巨鼴鼠鑽進地底(打不到)、換階段', async ({ page }) => {
    await open(page, 'w9-3');
    await page.evaluate(() => window.__GK__!.warp!(9700));
    await page.waitForFunction(() => window.__GK__!.boss?.type === 'mole', undefined, { timeout: 8000 });
    await page.waitForFunction(() => window.__GK__!.boss?.hidden === true, undefined, { timeout: 8000 });
    await page.waitForFunction(() => window.__GK__!.boss?.hidden === false, undefined, { timeout: 6000 });
    await page.evaluate(() => window.__GK__!.hurtBoss!(150));
    await page.waitForFunction(() => window.__GK__!.boss!.phase === 2, undefined, { timeout: 3000 });
    await page.waitForTimeout(300);
    expect((await gk(page)).enemies!.find((e) => e.type === 'mole')!.artKey).toMatch(/^(mole-2|w9-giant-mole-boss-phase2-)/);
  });
});

test('選關:通過 8-3 才開放世界 9', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.removeItem('gk.test.v1');
    const all = ['w1-1', 'w1-2', 'forest'];
    for (let w = 2; w <= 8; w++) for (let l = 1; l <= 3; l++) all.push(`w${w}-${l}`);
    localStorage.setItem('gk.save.v1', JSON.stringify({ version: 1, weapons: {}, cleared: Object.fromEntries(all.map((id) => [id, 1])) }));
  });
  await page.goto('./?test=1');
  await page.waitForFunction(() => window.__GK__?.screen === 'mode-select', undefined, { timeout: 15000 });
  await page.locator('canvas').click({ position: { x: 5, y: 5 } });
  await page.keyboard.press('Digit1');
  await page.waitForFunction(() => window.__GK__!.screen === 'level-select');
  const s = await gk(page);
  expect(s.world).toBe(9);
  expect(s.levels!.map((l) => [l.id, l.unlocked])).toEqual([
    ['w9-1', true],
    ['w9-2', false],
    ['w9-3', false],
  ]);
});
