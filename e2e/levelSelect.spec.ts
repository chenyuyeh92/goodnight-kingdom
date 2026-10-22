import { test, expect, type Page } from '@playwright/test';

async function gk(page: Page) {
  return page.evaluate(() => window.__GK__!);
}

async function openLevelSelect(page: Page, save: object | null): Promise<void> {
  await page.addInitScript((s) => {
    if (s === null) localStorage.removeItem('gk.save.v1');
    else localStorage.setItem('gk.save.v1', s);
  }, save === null ? null : JSON.stringify(save));
  await page.goto('./?test=1');
  await page.waitForFunction(() => window.__GK__?.screen === 'mode-select', undefined, { timeout: 15000 });
  await page.locator('canvas').click({ position: { x: 5, y: 5 } });
  await page.keyboard.press('Digit1');
  await page.waitForFunction(() => window.__GK__!.screen === 'level-select');
}

test.describe('選關', () => {
  test('一開始只有 1-1 能玩', async ({ page }) => {
    await openLevelSelect(page, null);
    expect((await gk(page)).levels!.map((l) => [l.id, l.unlocked])).toEqual([
      ['w1-1', true],
      ['w1-2', false],
      ['forest', false],
    ]);
    await page.keyboard.press('Digit2');
    await page.waitForTimeout(300);
    expect((await gk(page)).screen).toBe('level-select');
    await page.keyboard.press('Digit1');
    await page.waitForFunction(() => window.__GK__!.screen === 'range');
    expect((await gk(page)).level).toBe('w1-1');
  });

  test('舊存檔(沒有通關紀錄)也能正常開始', async ({ page }) => {
    await openLevelSelect(page, { version: 1, weapons: {} });
    expect((await gk(page)).levels![0].unlocked).toBe(true);
  });

  test('通過 1-1 後可以玩 1-2', async ({ page }) => {
    await openLevelSelect(page, { version: 1, weapons: {}, cleared: { 'w1-1': 200000 } });
    const levels = (await gk(page)).levels!;
    expect(levels[0].best).toBe(200000);
    expect(levels[1].unlocked).toBe(true);
    await page.keyboard.press('Digit2');
    await page.waitForFunction(() => window.__GK__!.screen === 'range');
    expect((await gk(page)).level).toBe('w1-2');
  });

  test('Esc 回到主頁', async ({ page }) => {
    await openLevelSelect(page, null);
    await page.keyboard.press('Escape');
    await page.waitForFunction(() => window.__GK__!.screen === 'mode-select');
  });

  test('通關後記下紀錄,按 3 進下一關', async ({ page }) => {
    await page.addInitScript(() => localStorage.removeItem('gk.save.v1'));
    await page.goto('./?mode=single&test=1&level=w1-1');
    await page.waitForFunction(() => window.__GK__?.screen === 'range', undefined, { timeout: 20000 });
    const bossAt = await page.evaluate(() => window.__GK__!.bossLockX!);
    await page.evaluate((x) => window.__GK__!.warp!(x + 500), bossAt);
    await page.waitForFunction(() => !!window.__GK__!.boss, undefined, { timeout: 15000 });
    await page.evaluate(() => window.__GK__!.hurtBoss!(9999));
    await page.waitForFunction(() => window.__GK__!.screen === 'complete', undefined, { timeout: 5000 });
    const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('gk.save.v1')!));
    expect(saved.cleared['w1-1']).toBeGreaterThan(0);
    await page.keyboard.press('Digit3');
    await page.waitForFunction(() => window.__GK__!.screen === 'range');
    expect((await gk(page)).level).toBe('w1-2');
  });
});
