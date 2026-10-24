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
    await openRange(page, './?level=range&mode=single&test=1');
  });

  test('鬧鐘蟲會朝玩家走過來,碰到扣愛心', async ({ page }) => {
    await spawn(page, 'alarmBug', 600);
    const x0 = (await gk(page)).enemies![0].x;
    await page.waitForFunction((x) => window.__GK__!.enemies![0].x < x - 20, x0, { timeout: 2000 });
    await page.waitForFunction(() => window.__GK__!.players![0].hearts === 9, undefined, { timeout: 10000 });
  });

  test('射擊打倒鬧鐘蟲', async ({ page }) => {
    await spawn(page, 'alarmBug', 350);
    await page.keyboard.down('KeyC');
    await page.waitForFunction(() => window.__GK__!.enemiesDefeated === 1, undefined, { timeout: 4000 });
    await page.keyboard.up('KeyC');
    expect((await gk(page)).enemies).toHaveLength(0);
  });

  test('刺蝟正面擋子彈,盾牌被打得越來越破', async ({ page }) => {
    await spawn(page, 'hedgehog', 320);
    await page.keyboard.down('KeyC');
    await page.waitForFunction(() => (window.__GK__!.blockedShots ?? 0) >= 3, undefined, { timeout: 3000 });
    await page.keyboard.up('KeyC');
    const s = await gk(page);
    expect(s.enemies![0].hp).toBe(6);
    expect(s.enemies![0].shieldHp).toBeLessThan(15);
    expect(s.enemies![0].shieldHp).toBeGreaterThan(0);
  });

  test('一直打刺蝟正面,擋下 15 點就破盾,之後打得到', async ({ page }) => {
    await spawn(page, 'hedgehog', 320);
    await page.keyboard.down('KeyC');
    await page.waitForFunction(() => window.__GK__!.shieldsBroken === 1, undefined, { timeout: 8000 });
    expect((await gk(page)).blockedShots).toBeGreaterThanOrEqual(15);
    await page.waitForFunction(() => (window.__GK__!.enemies![0]?.hp ?? 0) < 6 || window.__GK__!.enemiesDefeated === 1, undefined, { timeout: 4000 });
    await page.keyboard.up('KeyC');
    expect((await gk(page)).enemies![0]?.shieldHp ?? 0).toBe(0);
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

async function hurtUntilDown(page: Page): Promise<void> {
  const deadline = Date.now() + 20000;
  while (!(await gk(page)).players![0].down) {
    if (Date.now() > deadline) throw new Error('hurtUntilDown 逾時');
    await page.evaluate(() => window.__GK__!.hurt!(0));
    await page.waitForTimeout(100);
  }
}

async function enterArena1(page: Page): Promise<number> {
  await page.evaluate(() => window.__GK__!.warp!(1900));
  await page.waitForFunction(() => window.__GK__!.arena!.locked, undefined, { timeout: 15000 });
  return (await gk(page)).cameraX!;
}

test.describe('戰鬥區與零星魔物', () => {
  test('走過 300 會有鬧鐘蟲從右邊出現', async ({ page }) => {
    await openRange(page, './?level=range&mode=single');
    await page.keyboard.down('KeyD');
    await page.waitForFunction(() => window.__GK__!.cameraX! >= 300, undefined, { timeout: 10000 });
    await page.keyboard.up('KeyD');
    await page.waitForFunction(
      () => window.__GK__!.enemies!.some((e) => e.type === 'alarmBug' && e.x > window.__GK__!.cameraX! + 900),
      undefined,
      { timeout: 1000 },
    );
  });

  test('戰鬥區鎖住鏡頭,清完才解鎖', async ({ page }) => {
    await openRange(page, './?level=range&mode=single&test=1');
    const lockedX = await enterArena1(page);
    await page.keyboard.down('KeyD');
    await page.waitForTimeout(1500);
    await page.keyboard.up('KeyD');
    expect((await gk(page)).cameraX).toBe(lockedX);
    const deadline = Date.now() + 20000;
    while (!(await page.evaluate(() => !window.__GK__!.arena!.locked && window.__GK__!.arena!.nextArena === 1))) {
      if (Date.now() > deadline) throw new Error('戰鬥區沒有解鎖');
      await page.evaluate(() => window.__GK__!.defeatAll!());
      await page.waitForTimeout(300);
    }
    await page.keyboard.down('KeyD');
    await page.waitForTimeout(1000);
    await page.keyboard.up('KeyD');
    expect((await gk(page)).cameraX).toBeGreaterThan(lockedX);
  });

  test('戰鬥中重來不殘留戰鬥區魔物', async ({ page }) => {
    await openRange(page, './?level=range&mode=single&test=1');
    await enterArena1(page);
    await page.waitForFunction(() => window.__GK__!.enemies!.some((e) => e.arena), undefined, { timeout: 3000 });
    await hurtUntilDown(page);
    await page.waitForFunction(() => window.__GK__!.restarts === 1, undefined, { timeout: 3000 });
    await page.waitForTimeout(300);
    const s = await gk(page);
    expect(s.checkpointX).toBe(1200);
    expect(s.cameraX).toBe(816);
    expect(s.arena!.locked).toBe(false);
    // 檢查點之前的零星魔物(300、700)鏡頭已經走過,不會再出現。
    expect(s.enemies).toHaveLength(0);
  });
});

test('從地面冒出的魔物在完全出現前不會傷人', async ({ page }) => {
  await openRange(page, './?level=range&mode=single&test=1');
  const x = (await gk(page)).players![0].x;
  await page.evaluate((px) => window.__GK__!.spawnGround!('alarmBug', px), x);
  await page.waitForTimeout(200);
  expect((await gk(page)).players![0].hearts).toBe(10);
  await page.waitForFunction(() => window.__GK__!.players![0].hearts === 9, undefined, { timeout: 3000 });
});

test('繞到刺蝟背後打得到', async ({ page }) => {
  await openRange(page, './?level=range&mode=single&test=1');
  await page.evaluate(() => window.__GK__!.spawn!('hedgehog', 320));
  await page.waitForFunction(() => window.__GK__!.enemies!.length === 1);
  await page.evaluate(() => window.__GK__!.warp!(420));
  await page.keyboard.down('KeyA');
  await page.waitForTimeout(40);
  await page.keyboard.up('KeyA');
  await page.keyboard.down('KeyC');
  await page.waitForTimeout(400);
  await page.keyboard.up('KeyC');
  const s = await gk(page);
  expect(s.enemies![0].hp).toBeLessThan(6);
});

test('清完的戰鬥區,睡著重來後不會再鎖住', async ({ page }) => {
  await openRange(page, './?level=range&mode=single&test=1');
  await enterArena1(page);
  const deadline = Date.now() + 20000;
  while (!(await page.evaluate(() => window.__GK__!.arena!.nextArena === 1))) {
    if (Date.now() > deadline) throw new Error('戰鬥區沒有解鎖');
    await page.evaluate(() => window.__GK__!.defeatAll!());
    await page.waitForTimeout(300);
  }
  await page.evaluate(() => window.__GK__!.warp!(2100));
  await page.waitForTimeout(300);
  await hurtUntilDown(page);
  await page.waitForFunction(() => window.__GK__!.restarts === 1, undefined, { timeout: 3000 });
  await page.waitForTimeout(500);
  const s = await gk(page);
  expect(s.checkpointX).toBe(2000);
  expect(s.arena!.locked).toBe(false);
  expect(s.arena!.nextArena).toBe(1);
});

test.describe('世界邊界', () => {
  test('掉出世界的魔物會被移除', async ({ page }) => {
    await openRange(page, './?level=range&mode=single&test=1');
    await page.evaluate(() => window.__GK__!.spawn!('alarmBug', 1000, 700));
    await page.waitForTimeout(500);
    expect((await gk(page)).enemies).toHaveLength(0);
  });

  test('在世界右邊外生成的魔物會被夾回世界內', async ({ page }) => {
    await openRange(page, './?level=range&mode=single&test=1');
    await spawn(page, 'alarmBug', 5000);
    expect((await gk(page)).enemies![0].x).toBeLessThanOrEqual(3200);
  });
});
