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

  test('魔王戰:幾秒後從四面八方叫一群雜魚,最多 9 隻', async ({ page }) => {
    await open(page, 'w1-1');
    await page.evaluate(() => window.__GK__!.warp!(window.__GK__!.bossLockX! + 500));
    await page.waitForFunction(() => !!window.__GK__!.boss, undefined, { timeout: 8000 });
    await page.waitForFunction(() => window.__GK__!.fodder!.bossAlive >= 1, undefined, { timeout: 8000 });
    let most = 0;
    let calls = 0;
    for (let i = 0; i < 28; i++) {
      const f = (await gk(page)).fodder!;
      most = Math.max(most, f.bossAlive);
      calls = Math.max(calls, f.bossCalls);
      await page.waitForTimeout(500);
    }
    expect(most).toBeLessThanOrEqual(9);
    expect(calls).toBeGreaterThanOrEqual(2);
  });

  test('路上的雜魚潮:幾秒一群,從右、上、左輪流來,同時最多 8 隻', async ({ page }) => {
    await open(page, 'w1-1');
    await page.evaluate(() => window.__GK__!.warp!(1500));
    await page.waitForFunction(() => window.__GK__!.fodder!.ambientCalls >= 3, undefined, { timeout: 12000 });
    expect((await gk(page)).fodder!.ambientAlive).toBeLessThanOrEqual(8);
  });

  test('魔王區前一個畫面就不叫雜魚潮;測試可以關掉', async ({ page }) => {
    await open(page, 'w1-1');
    await page.evaluate(() => window.__GK__!.warp!(window.__GK__!.bossLockX! - 600));
    await page.waitForTimeout(4000);
    expect((await gk(page)).fodder!.ambientCalls).toBe(0);
    await page.evaluate(() => window.__GK__!.setAmbient!(false));
    await page.evaluate(() => window.__GK__!.warp!(1500));
    await page.waitForTimeout(4000);
    expect((await gk(page)).fodder!.ambientCalls).toBe(0);
  });

  test('夢貘放大惡夢集氣時不叫雜魚', async ({ page }) => {
    await open(page, 'w10-3');
    await page.evaluate(() => window.__GK__!.warp!(9700));
    await page.waitForFunction(() => window.__GK__!.boss?.type === 'tapir', undefined, { timeout: 8000 });
    // 先等 1.5 秒:叫雜魚的計時(第二階段 3 秒)會在集氣的 3 秒裡到期,不暫停就會叫。
    await page.waitForTimeout(1500);
    await page.evaluate(() => window.__GK__!.hurtBoss!(180));
    await page.waitForFunction(() => window.__GK__!.w10!.nightmare !== null, undefined, { timeout: 4000 });
    const calls0 = (await gk(page)).fodder!.bossCalls;
    await page.waitForFunction(() => window.__GK__!.w10!.nightmare === null, undefined, { timeout: 5000 });
    expect((await gk(page)).fodder!.bossCalls).toBe(calls0);
  });
});
