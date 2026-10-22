import { test, expect, type Page } from '@playwright/test';
import { TEST_TOOLS } from '../src/config/testTools';

async function gk(page: Page) {
  return page.evaluate(() => window.__GK__!);
}

async function openLevelSelect(page: Page): Promise<void> {
  await page.addInitScript(() => {
    localStorage.removeItem('gk.save.v1');
    localStorage.removeItem('gk.test.v1');
  });
  await page.goto('./?test=1');
  await page.waitForFunction(() => window.__GK__?.screen === 'mode-select', undefined, { timeout: 15000 });
  await page.locator('canvas').click({ position: { x: 5, y: 5 } });
  await page.keyboard.press('Digit1');
  await page.waitForFunction(() => window.__GK__!.screen === 'level-select');
}

test.describe('測試模式(上市前會拿掉)', () => {
  test.skip(!TEST_TOOLS, '測試工具已關閉');

  test('按 T 打開:所有世界、所有關卡都能玩,再按一次關掉', async ({ page }) => {
    await openLevelSelect(page);
    expect((await gk(page)).levels!.map((l) => l.unlocked)).toEqual([true, false, false]);
    await page.keyboard.press('KeyT');
    await page.waitForFunction(() => window.__GK__!.testMode === true);
    expect((await gk(page)).levels!.every((l) => l.unlocked)).toBe(true);
    await page.keyboard.press('KeyE');
    await page.waitForFunction(() => window.__GK__!.world === 2);
    expect((await gk(page)).levels!.every((l) => l.unlocked)).toBe(true);
    await page.keyboard.press('KeyT');
    await page.waitForFunction(() => window.__GK__!.testMode === false);
    expect((await gk(page)).levels!.map((l) => l.unlocked)).toEqual([false, false, false]);
  });

  test('重新整理後還記得;Shift+數字直接從關主前開始', async ({ page }) => {
    await openLevelSelect(page);
    await page.keyboard.press('KeyT');
    await page.waitForFunction(() => window.__GK__!.testMode === true);
    await page.keyboard.press('KeyE');
    await page.waitForFunction(() => window.__GK__!.world === 2);
    await page.keyboard.down('Shift');
    await page.keyboard.press('Digit3');
    await page.keyboard.up('Shift');
    await page.waitForFunction(() => window.__GK__!.screen === 'range');
    const s = await gk(page);
    expect(s.level).toBe('w2-3');
    expect(s.checkpointX).toBeGreaterThan(9000);
    expect(s.arena!.locked).toBe(false);
    await page.keyboard.down('KeyD');
    await page.waitForFunction(() => window.__GK__!.boss?.type === 'sphinx', undefined, { timeout: 8000 });
    await page.keyboard.up('KeyD');
  });
});
