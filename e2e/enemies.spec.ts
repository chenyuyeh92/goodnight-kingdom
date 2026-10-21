import { test, expect, type Page } from '@playwright/test';

async function gk(page: Page) {
  return page.evaluate(() => window.__GK__!);
}

async function openRange(page: Page, path: string): Promise<void> {
  await page.goto(path);
  await page.waitForFunction(() => window.__GK__?.screen === 'range', undefined, { timeout: 15000 });
  await page.locator('canvas').click();
  await page.waitForTimeout(300);
}

async function spawn(page: Page, type: string, x: number, y?: number): Promise<void> {
  const before = (await gk(page)).enemies!.length;
  await page.evaluate(([t, sx, sy]) => window.__GK__!.spawn!(t as never, sx as number, sy as number | undefined), [type, x, y] as const);
  await page.waitForFunction((n) => window.__GK__!.enemies!.length > n, before);
}

test.describe('魔物', () => {
  test.beforeEach(async ({ page }) => {
    await openRange(page, './?mode=single&test=1');
  });

  test('鬧鐘蟲會朝玩家走過來,碰到扣愛心', async ({ page }) => {
    await spawn(page, 'alarmBug', 600);
    const x0 = (await gk(page)).enemies![0].x;
    await page.waitForFunction((x) => window.__GK__!.enemies![0].x < x - 20, x0, { timeout: 2000 });
    await page.waitForFunction(() => window.__GK__!.players![0].hearts === 2, undefined, { timeout: 10000 });
  });

  test('射擊打倒鬧鐘蟲', async ({ page }) => {
    await spawn(page, 'alarmBug', 350);
    await page.keyboard.down('KeyC');
    await page.waitForFunction(() => window.__GK__!.enemiesDefeated === 1, undefined, { timeout: 4000 });
    await page.keyboard.up('KeyC');
    expect((await gk(page)).enemies).toHaveLength(0);
  });

  test('刺蝟正面擋子彈', async ({ page }) => {
    await spawn(page, 'hedgehog', 320);
    await page.keyboard.down('KeyC');
    await page.waitForTimeout(1200);
    await page.keyboard.up('KeyC');
    const s = await gk(page);
    expect(s.blockedShots).toBeGreaterThan(0);
    expect(s.enemies![0].hp).toBe(6);
  });

  test('蝙蝠在頭上,往上射打得到', async ({ page }) => {
    await spawn(page, 'nightBat', 160, 320);
    await page.keyboard.down('KeyW');
    await page.keyboard.down('KeyC');
    await page.waitForFunction(() => window.__GK__!.enemiesDefeated === 1, undefined, { timeout: 5000 });
    await page.keyboard.up('KeyC');
    await page.keyboard.up('KeyW');
  });

  test('咖啡豆會跳', async ({ page }) => {
    await spawn(page, 'coffeeBean', 600);
    await page.waitForFunction(() => (window.__GK__!.enemies![0]?.y ?? 999) < 440, undefined, { timeout: 3000 });
  });

  test('跑到畫面左方很遠的魔物會被清掉', async ({ page }) => {
    await page.keyboard.down('KeyD');
    await page.waitForFunction(() => window.__GK__!.cameraX! > 400, undefined, { timeout: 10000 });
    await page.keyboard.up('KeyD');
    await page.evaluate(() => window.__GK__!.spawn!('nightBat', 50, 320));
    await page.waitForTimeout(200);
    expect((await gk(page)).enemies!.filter((e) => e.type === 'nightBat')).toHaveLength(0);
  });
});
