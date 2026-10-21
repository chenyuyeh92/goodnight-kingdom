import { test, expect, type Page } from '@playwright/test';

async function gk(page: Page) {
  return page.evaluate(() => window.__GK__!);
}

async function open(page: Page): Promise<void> {
  await page.goto('./?level=range&mode=single&test=1');
  await page.waitForFunction(() => window.__GK__?.screen === 'range', undefined, { timeout: 15000 });
  await page.locator('canvas').click();
  await page.waitForTimeout(300);
}

async function spawn(page: Page, type: string, x: number): Promise<void> {
  await page.evaluate(([t, sx]) => window.__GK__!.spawn!(t as never, sx as number), [type, x] as const);
  await page.waitForFunction(() => window.__GK__!.enemies!.length > 0);
}

async function tap(page: Page, code: string, ms = 60): Promise<void> {
  await page.keyboard.down(code);
  await page.waitForTimeout(ms);
  await page.keyboard.up(code);
}

test.describe('枕頭揮擊', () => {
  test.beforeEach(async ({ page }) => {
    await open(page);
  });

  test('貼近鬧鐘蟲一下打倒', async ({ page }) => {
    await spawn(page, 'alarmBug', 195);
    await tap(page, 'KeyC');
    await page.waitForFunction(() => window.__GK__!.enemiesDefeated === 1, undefined, { timeout: 1000 });
    const s = await gk(page);
    expect(s.meleeHits).toBe(1);
    expect(s.bullets).toBe(0);
  });

  test('距離遠時照常射泡泡', async ({ page }) => {
    await spawn(page, 'alarmBug', 350);
    await tap(page, 'KeyC');
    const s = await gk(page);
    expect(s.meleeHits).toBe(0);
    expect(s.bullets).toBeGreaterThan(0);
  });

  test('刺蝟正面擋揮擊', async ({ page }) => {
    await spawn(page, 'hedgehog', 195);
    await tap(page, 'KeyC');
    await page.waitForTimeout(100);
    const s = await gk(page);
    expect(s.meleeSwings).toBeGreaterThan(0);
    expect(s.meleeHits).toBe(0);
    expect(s.blockedShots).toBeGreaterThan(0);
    expect(s.enemies![0].hp).toBe(6);
  });

  test('從刺蝟背後揮擊扣 5 血', async ({ page }) => {
    await spawn(page, 'hedgehog', 320);
    await page.evaluate(() => window.__GK__!.warp!(365));
    await tap(page, 'KeyA', 30);
    await tap(page, 'KeyC');
    await page.waitForTimeout(100);
    expect((await gk(page)).enemies![0].hp).toBe(1);
  });
});
