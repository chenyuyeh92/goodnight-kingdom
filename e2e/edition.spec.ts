import { test, expect } from '@playwright/test';

// 網頁版是免費版:世界 1–3 可以玩,世界 4–10 要完整版(?test=1 會全部開放,這裡加 free=1 測免費版)。

const CLEARED_1_TO_3 = Object.fromEntries(['w1-1', 'w1-2', 'forest', 'w2-1', 'w2-2', 'w2-3', 'w3-1', 'w3-2', 'w3-3'].map((id) => [id, 100000]));

test.describe('免費版', () => {
  test('打完世界 1–3 後,世界 4 的關卡鎖著,寫著完整版', async ({ page }) => {
    await page.addInitScript((c) => localStorage.setItem('gk.save.v1', JSON.stringify({ version: 1, weapons: {}, cleared: c, story: { opening: true } })), CLEARED_1_TO_3);
    await page.goto('./');
    await page.waitForFunction(() => window.__GK__?.screen === 'mode-select', undefined, { timeout: 15000 });
    await page.locator('canvas').click({ position: { x: 5, y: 5 } });
    await page.keyboard.press('Digit1');
    await page.waitForFunction(() => window.__GK__?.screen === 'level-select');
    // 選關畫面開在玩到的世界;世界 4 整個鎖住。
    const s = await page.evaluate(() => window.__GK__!);
    expect(s.world).toBe(4);
    expect(s.levels!.every((l) => !l.unlocked)).toBe(true);
    await page.keyboard.press('Digit1');
    await page.waitForTimeout(400);
    expect(await page.evaluate(() => window.__GK__!.screen)).toBe('level-select');
    // 世界 3 照常可以玩。
    await page.keyboard.press('KeyQ');
    await page.waitForFunction(() => window.__GK__?.world === 3);
    expect((await page.evaluate(() => window.__GK__!.levels!)).every((l) => l.unlocked)).toBe(true);
  });

  test('網址不能直接跳到世界 4 以後的關卡', async ({ page }) => {
    await page.goto('./?mode=single&test=1&free=1&level=w5-1');
    await page.waitForFunction(() => window.__GK__?.screen === 'range', undefined, { timeout: 15000 });
    expect(await page.evaluate(() => window.__GK__!.level)).not.toBe('w5-1');
  });

  test('3-3 打完:結算畫面沒有「下一關」,寫著完整版還有世界 4–10', async ({ page }) => {
    await page.goto('./?mode=single&test=1&free=1&level=w3-3');
    await page.waitForFunction(() => window.__GK__?.screen === 'range', undefined, { timeout: 15000 });
    await page.locator('canvas').click({ position: { x: 5, y: 5 } });
    await page.evaluate(() => window.__GK__!.warp!(window.__GK__!.bossLockX! + 500));
    await page.waitForFunction(() => !!window.__GK__!.boss, undefined, { timeout: 15000 });
    await page.evaluate(() => window.__GK__!.hurtBoss!(99999));
    await page.waitForFunction(() => window.__GK__?.screen === 'complete', undefined, { timeout: 20000 });
    expect(await page.evaluate(() => window.__GK__!.fullTeaser)).toBe(true);
    await page.keyboard.press('Digit3');
    await page.waitForTimeout(400);
    expect(await page.evaluate(() => window.__GK__!.screen)).toBe('complete');
  });
});
