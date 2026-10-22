import { test, expect, type Page } from '@playwright/test';

async function gk(page: Page) {
  return page.evaluate(() => window.__GK__!);
}

async function open(page: Page, mode = 'single'): Promise<void> {
  await page.goto(`./?mode=${mode}&test=1&level=w1-1`);
  await page.waitForFunction(() => window.__GK__?.screen === 'range', undefined, { timeout: 20000 });
}

async function enterBoss(page: Page): Promise<void> {
  await page.evaluate(() => window.__GK__!.warp!(window.__GK__!.bossLockX! + 500));
  await page.waitForFunction(() => !!window.__GK__!.boss, undefined, { timeout: 15000 });
}

test.describe('1-1 草原', () => {
  test('進得去,背景是草原', async ({ page }) => {
    await open(page);
    const s = await gk(page);
    expect(s.level).toBe('w1-1');
    expect(s.art!.missing).toEqual([]);
  });

  test('小頭目大鬧鐘蟲:血量 25,會叫小鬧鐘蟲', async ({ page }) => {
    await open(page);
    await enterBoss(page);
    expect((await gk(page)).boss!.maxHp).toBe(25);
    await page.waitForFunction(
      () => window.__GK__!.enemies!.some((e) => e.type === 'alarmBug'),
      undefined,
      { timeout: 7000 },
    );
  });

  test('雙人時小頭目血量 1.5 倍', async ({ page }) => {
    await open(page, 'duo');
    await enterBoss(page);
    expect((await gk(page)).boss!.maxHp).toBe(38);
  });

  test('小頭目不會走出鎖住的畫面', async ({ page }) => {
    await open(page);
    await enterBoss(page);
    await page.waitForTimeout(3000);
    const s = await gk(page);
    const boss = s.enemies!.find((e) => e.type === 'bigClockBug')!;
    expect(boss.x).toBeGreaterThanOrEqual(s.cameraX!);
    expect(boss.x).toBeLessThanOrEqual(s.cameraX! + 960);
  });

  test('打倒小頭目通關', async ({ page }) => {
    await open(page);
    await enterBoss(page);
    await page.evaluate(() => window.__GK__!.hurtBoss!(9999));
    await page.waitForFunction(() => window.__GK__!.screen === 'complete', undefined, { timeout: 5000 });
    expect((await gk(page)).summary!.join('\n')).toContain('找到寶箱 0 / 3');
  });
});
