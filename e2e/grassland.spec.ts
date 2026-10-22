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

  test('小頭目失眠大松鼠:血量 35,丟橡實,轉身用尾巴擋子彈', async ({ page }) => {
    await open(page);
    await enterBoss(page);
    const s = await gk(page);
    expect(s.boss!.type).toBe('squirrel');
    expect(s.boss!.maxHp).toBe(35);
    await page.waitForFunction(() => (window.__GK__!.enemyShots ?? 0) > 0, undefined, { timeout: 4000 });
    await page.waitForFunction(() => window.__GK__!.boss!.armored, undefined, { timeout: 5000 });
    // 擋的時候背對玩家(圖朝左,背對玩家 = 面向右)。
    expect((await gk(page)).enemies!.find((e) => e.type === 'squirrel')!.facing).toBe(1);
  });

  test('雙人時小頭目血量 1.5 倍', async ({ page }) => {
    await open(page, 'duo');
    await enterBoss(page);
    expect((await gk(page)).boss!.maxHp).toBe(53);
  });

  test('大松鼠會跳到不同位置(不會卡在平台下面原地跳)', async ({ page }) => {
    await open(page);
    await enterBoss(page);
    const xs: number[] = [];
    for (let i = 0; i < 24; i++) {
      await page.waitForTimeout(500);
      const b = (await gk(page)).boss;
      if (b) xs.push(b.x);
    }
    expect(Math.max(...xs) - Math.min(...xs)).toBeGreaterThan(250);
  });

  test('小頭目不會走出鎖住的畫面', async ({ page }) => {
    await open(page);
    await enterBoss(page);
    await page.waitForTimeout(3000);
    const s = await gk(page);
    const boss = s.enemies!.find((e) => e.type === 'squirrel')!;
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
