import { test, expect, type Page } from '@playwright/test';

async function gk(page: Page) {
  return page.evaluate(() => window.__GK__!);
}

async function open(page: Page, path = './?mode=single&test=1'): Promise<void> {
  await page.goto(path);
  await page.waitForFunction(() => window.__GK__?.screen === 'range', undefined, { timeout: 15000 });
  await page.locator('canvas').click();
  await page.waitForTimeout(300);
}

async function give(page: Page, weapon: string, stars?: number): Promise<void> {
  await page.evaluate(([w, s]) => window.__GK__!.giveWeapon!(0, w as never, s as number | undefined), [weapon, stars] as const);
  await page.waitForFunction((w) => window.__GK__!.players![0].weapon === w, weapon);
}

async function spawn(page: Page, type: string, x: number, y?: number): Promise<void> {
  const n = (await gk(page)).enemies!.length;
  await page.evaluate(([t, sx, sy]) => window.__GK__!.spawn!(t as never, sx as number, sy as number | undefined), [type, x, y] as const);
  await page.waitForFunction((c) => window.__GK__!.enemies!.length > c, n);
}

async function hold(page: Page, code: string, ms: number): Promise<void> {
  await page.keyboard.down(code);
  await page.waitForTimeout(ms);
  await page.keyboard.up(code);
}

test.describe('武器', () => {
  test('數羊機槍射得比泡泡快並扣彈藥', async ({ page }) => {
    await open(page);
    await give(page, 'sheepGun');
    await hold(page, 'KeyC', 700);
    const ammo = (await gk(page)).players![0].ammo!;
    expect(ammo).toBeGreaterThanOrEqual(106);
    expect(ammo).toBeLessThanOrEqual(112);
  });

  test('彈藥用完換回哈欠泡泡', async ({ page }) => {
    await open(page);
    await give(page, 'pillowCannon');
    await page.keyboard.down('KeyC');
    await page.waitForFunction(() => window.__GK__!.players![0].weapon === 'yawnBubble', undefined, { timeout: 20000 });
    await page.waitForTimeout(300);
    expect((await gk(page)).bullets).toBeGreaterThan(0);
    await page.keyboard.up('KeyC');
  });

  test('枕頭砲一發穿透兩隻', async ({ page }) => {
    await open(page);
    await spawn(page, 'alarmBug', 300);
    await spawn(page, 'alarmBug', 360);
    await give(page, 'pillowCannon');
    await hold(page, 'KeyC', 60);
    await page.waitForFunction(() => window.__GK__!.enemies!.length === 2 && window.__GK__!.enemies!.every((e) => e.hp < 2) || window.__GK__!.enemiesDefeated! >= 2, undefined, { timeout: 1500 });
  });

  test('牛奶噴霧一次 5 發', async ({ page }) => {
    await open(page);
    await give(page, 'milkSpray');
    await page.keyboard.down('KeyC');
    await page.waitForFunction(() => (window.__GK__!.bullets ?? 0) >= 5, undefined, { timeout: 500 });
    await page.keyboard.up('KeyC');
    expect((await gk(page)).bullets! % 5).toBe(0);
  });

  test('豎琴音符會轉向打到頭上的蝙蝠', async ({ page }) => {
    await open(page);
    await spawn(page, 'nightBat', 400, 320);
    await give(page, 'lullabyHarp');
    await page.keyboard.down('KeyC');
    await page.waitForFunction(() => window.__GK__!.enemiesDefeated === 1, undefined, { timeout: 4000 });
    await page.keyboard.up('KeyC');
  });

  test('迴力鏢會飛回來', async ({ page }) => {
    await open(page);
    await give(page, 'blanketBoomerang');
    const x0 = (await gk(page)).players![0].x;
    await hold(page, 'KeyC', 60);
    expect((await gk(page)).bullets).toBe(1);
    await page.waitForFunction(() => window.__GK__!.bullets === 0, undefined, { timeout: 1500 });
    expect((await gk(page)).players![0].x).toBe(x0);
  });

  test('迴力鏢去程被刺盾擋,回程打到刺蝟背後', async ({ page }) => {
    await open(page);
    await spawn(page, 'hedgehog', 320);
    await give(page, 'blanketBoomerang');
    await hold(page, 'KeyC', 60);
    await page.waitForFunction(() => window.__GK__!.enemies![0].hp < 6, undefined, { timeout: 1500 });
    expect((await gk(page)).blockedShots).toBeGreaterThan(0);
  });

  test('迴力鏢主人睡著時不會永遠飛著', async ({ page }) => {
    await open(page, './?mode=duo&test=1');
    await give(page, 'blanketBoomerang');
    await hold(page, 'KeyC', 60);
    const deadline = Date.now() + 10000;
    while (!(await gk(page)).players![0].down) {
      if (Date.now() > deadline) throw new Error('沒有睡著');
      await page.evaluate(() => window.__GK__!.hurt!(0));
      await page.waitForTimeout(50);
    }
    await page.waitForFunction(() => window.__GK__!.bullets === 0, undefined, { timeout: 2500 });
  });

  test('月亮燈連射會過熱,冷卻後能再射', async ({ page }) => {
    await open(page);
    await give(page, 'moonLamp');
    await page.keyboard.down('KeyC');
    await page.waitForFunction(() => window.__GK__!.players![0].overheated, undefined, { timeout: 3000 });
    await page.keyboard.up('KeyC');
    await page.waitForFunction(() => !window.__GK__!.players![0].overheated, undefined, { timeout: 4000 });
  });

  test('熱可可讓射速變快', async ({ page }) => {
    await open(page);
    await page.evaluate(() => window.__GK__!.giveItem!(0, 'hotCocoa'));
    await give(page, 'sheepGun');
    await hold(page, 'KeyC', 700);
    const ammo = (await gk(page)).players![0].ammo!;
    expect(ammo).toBeGreaterThanOrEqual(96);
    expect(ammo).toBeLessThanOrEqual(104);
  });

  test('流星期間不扣彈藥', async ({ page }) => {
    await open(page);
    await page.evaluate(() => window.__GK__!.giveItem!(0, 'shootingStar'));
    await give(page, 'pillowCannon');
    await hold(page, 'KeyC', 1000);
    expect((await gk(page)).players![0].ammo).toBe(30);
  });
});
