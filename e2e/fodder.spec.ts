import { test, expect, type Page } from '@playwright/test';

async function gk(page: Page) {
  return page.evaluate(() => window.__GK__!);
}

async function open(page: Page, level: string): Promise<void> {
  await page.goto(`./?mode=single&test=1&level=${level}`);
  await page.waitForFunction(() => window.__GK__?.screen === 'range', undefined, { timeout: 30000 });
  await page.locator('canvas').click({ position: { x: 5, y: 5 } });
}

test.describe('雜魚變多', () => {
  test('一般關卡:零星的雜魚一次來一群(多兩隻跟班)', async ({ page }) => {
    await open(page, 'w1-1');
    await page.keyboard.down('KeyD');
    await page.waitForFunction(() => (window.__GK__!.fodder?.echoes ?? 0) >= 2, undefined, { timeout: 6000 });
    await page.keyboard.up('KeyD');
  });

  test('魔王戰:幾秒後從旁邊叫一群雜魚,最多 6 隻', async ({ page }) => {
    await open(page, 'w1-1');
    await page.evaluate(() => window.__GK__!.warp!(window.__GK__!.bossLockX! + 500));
    await page.waitForFunction(() => !!window.__GK__!.boss, undefined, { timeout: 8000 });
    await page.waitForFunction(() => window.__GK__!.fodder!.bossAlive >= 1, undefined, { timeout: 8000 });
    let most = 0;
    for (let i = 0; i < 28; i++) {
      most = Math.max(most, (await gk(page)).fodder!.bossAlive);
      await page.waitForTimeout(500);
    }
    expect(most).toBeLessThanOrEqual(6);
  });

  test('夢貘放大惡夢集氣時不叫雜魚', async ({ page }) => {
    await open(page, 'w10-3');
    await page.evaluate(() => window.__GK__!.warp!(9700));
    await page.waitForFunction(() => window.__GK__!.boss?.type === 'tapir', undefined, { timeout: 8000 });
    await page.evaluate(() => window.__GK__!.hurtBoss!(60));
    await page.waitForFunction(() => window.__GK__!.w10!.nightmare !== null, undefined, { timeout: 4000 });
    const calls0 = (await gk(page)).fodder!.bossCalls;
    await page.waitForFunction(() => window.__GK__!.w10!.nightmare === null, undefined, { timeout: 5000 });
    expect((await gk(page)).fodder!.bossCalls).toBe(calls0);
  });
});
