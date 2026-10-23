import { test, expect, type Page } from '@playwright/test';

async function gk(page: Page) {
  return page.evaluate(() => window.__GK__!);
}

async function open(page: Page, path = './?level=range&mode=single&test=1'): Promise<void> {
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

  test('牛奶噴霧一次 4 發', async ({ page }) => {
    await open(page);
    await give(page, 'milkSpray');
    await page.keyboard.down('KeyC');
    // 在第一次發射的那一格就讀數量:往下斜的那發很快會碰到地面消失。
    const first = await page.waitForFunction(() => {
      const b = window.__GK__!.bullets ?? 0;
      return b > 0 ? b : false;
    }, undefined, { timeout: 500, polling: 'raf' });
    await page.keyboard.up('KeyC');
    expect(await first.jsonValue()).toBe(4);
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
    // 近一點:迴力鏢一定飛過刺蝟背後才折回(遠的時候可能在刺蝟正前方就折回,回程又被擋)。
    await spawn(page, 'hedgehog', 260);
    await give(page, 'blanketBoomerang');
    await hold(page, 'KeyC', 60);
    // 迴力鏢一下 6 點,刺蝟(6 血)回程被打到就睡著。
    await page.waitForFunction(() => (window.__GK__!.enemiesDefeated ?? 0) > 0 || window.__GK__!.enemies![0].hp < 6, undefined, { timeout: 1500 });
    expect((await gk(page)).blockedShots).toBeGreaterThan(0);
  });

  test('迴力鏢主人睡著時不會永遠飛著', async ({ page }) => {
    await open(page, './?level=range&mode=duo&test=1');
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
    await page.waitForFunction(() => window.__GK__!.players![0].overheated, undefined, { timeout: 5000 });
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

async function hurtUntilDown(page: Page, i = 0): Promise<void> {
  const deadline = Date.now() + 20000;
  while (!(await gk(page)).players![i].down) {
    if (Date.now() > deadline) throw new Error('hurtUntilDown 逾時');
    await page.evaluate((n) => window.__GK__!.hurt!(n), i);
    await page.waitForTimeout(100);
  }
}

/** 移到 x=960 寶箱左邊往右走,直到開箱。 */
async function openChestAt900(page: Page, rig: string): Promise<void> {
  await page.evaluate((w) => window.__GK__!.rigChest!(w as never), rig);
  const before = (await gk(page)).chestsOpened!;
  await page.evaluate(() => window.__GK__!.warp!(860));
  await page.keyboard.down('KeyD');
  await page.waitForFunction((n) => window.__GK__!.chestsOpened! > n, before, { timeout: 3000 });
  await page.keyboard.up('KeyD');
}

test.describe('寶箱、道具與背包', () => {
  test('走到寶箱會打開並換上武器,背包記住', async ({ page }) => {
    await open(page);
    await page.evaluate(() => window.__GK__!.clearSave!());
    await openChestAt900(page, 'sheepGun');
    const s = await gk(page);
    expect(s.players![0].weapon).toBe('sheepGun');
    expect(s.backpack!.sheepGun).toBe(1);
    expect(s.lastChest).toBe('new');
    await page.reload();
    await page.waitForFunction(() => window.__GK__?.screen === 'range', undefined, { timeout: 15000 });
    expect((await gk(page)).backpack!.sheepGun).toBe(1);
  });

  test('重複抽到升星,三星後改給牛奶瓶', async ({ page }) => {
    await open(page);
    await page.evaluate(() => window.__GK__!.clearSave!());
    for (let round = 1; round <= 4; round++) {
      await openChestAt900(page, 'sheepGun');
      const s = await gk(page);
      expect(s.backpack!.sheepGun).toBe(Math.min(round, 3));
      expect(s.lastChest).toBe(round === 1 ? 'new' : round <= 3 ? 'starUp' : 'maxed');
      const restarts = s.restarts!;
      await hurtUntilDown(page);
      await page.waitForFunction((r) => window.__GK__!.restarts === r + 1, restarts, { timeout: 3000 });
      await page.evaluate(() => window.__GK__!.resetChests!());
    }
  });

  test('兩人同時碰到同一個寶箱只有一人拿到', async ({ page }) => {
    await open(page, './?level=range&mode=duo&test=1');
    await page.evaluate(() => window.__GK__!.rigChest!('pillowCannon'));
    await page.evaluate(() => window.__GK__!.warp!(940));
    await page.waitForFunction(() => window.__GK__!.chestsOpened === 1, undefined, { timeout: 3000 });
    await page.waitForTimeout(300);
    const s = await gk(page);
    expect(s.chestsOpened).toBe(1);
    expect(s.players!.filter((p) => p.weapon === 'pillowCannon')).toHaveLength(1);
  });

  test('睡著重來後已經開過的寶箱維持打開', async ({ page }) => {
    await open(page);
    await page.evaluate(() => window.__GK__!.clearSave!());
    await openChestAt900(page, 'sheepGun');
    await hurtUntilDown(page);
    await page.waitForFunction(() => window.__GK__!.restarts === 1, undefined, { timeout: 3000 });
    expect((await gk(page)).openedChests).toEqual([0]);
    await page.evaluate(() => window.__GK__!.warp!(860));
    await page.keyboard.down('KeyD');
    await page.waitForTimeout(800);
    await page.keyboard.up('KeyD');
    const s = await gk(page);
    expect(s.backpack!.sheepGun).toBe(1);
    expect(s.lastChest).toBeNull();
  });

  test('刺蝟正面擋得住牛奶噴霧', async ({ page }) => {
    await open(page);
    await spawn(page, 'hedgehog', 240);
    await give(page, 'milkSpray');
    await hold(page, 'KeyC', 60);
    await page.waitForTimeout(300);
    const s = await gk(page);
    expect(s.blockedShots).toBeGreaterThan(0);
    expect(s.enemies![0].hp).toBe(6);
  });

  test('刺蝟正面擋得住豎琴音符', async ({ page }) => {
    await open(page);
    await spawn(page, 'hedgehog', 400);
    await give(page, 'lullabyHarp');
    // 一顆 2 點,盾牌 15 點會破:只射幾發。
    await hold(page, 'KeyC', 300);
    await page.waitForTimeout(500);
    expect((await gk(page)).enemies![0].hp).toBe(6);
  });

  test('魔物掉出的道具可以撿', async ({ page }) => {
    await open(page);
    await page.evaluate(() => window.__GK__!.rigDrop!('smallPillow'));
    await page.evaluate(() => window.__GK__!.hurt!(0));
    await page.waitForFunction(() => window.__GK__!.players![0].hearts === 5);
    await spawn(page, 'alarmBug', 330);
    await page.keyboard.down('KeyC');
    await page.waitForFunction(() => window.__GK__!.enemiesDefeated === 1, undefined, { timeout: 4000 });
    await page.keyboard.up('KeyC');
    await page.waitForFunction(() => window.__GK__!.items === 1, undefined, { timeout: 1000 });
    await page.keyboard.down('KeyD');
    await page.waitForFunction(() => window.__GK__!.players![0].hearts === 6, undefined, { timeout: 4000 });
    await page.keyboard.up('KeyD');
    expect((await gk(page)).items).toBe(0);
  });

  test('存檔壞掉時遊戲照常', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('gk.save.v1', '{bad'));
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await open(page);
    expect((await gk(page)).backpack).toEqual({});
    expect(errors).toEqual([]);
  });
});

test('無法存檔時開場選單會提示', async ({ page }) => {
  await page.addInitScript(() => {
    Storage.prototype.setItem = () => {
      throw new Error('blocked');
    };
  });
  await page.goto('./');
  await page.waitForFunction(() => window.__GK__?.screen === 'mode-select', undefined, { timeout: 15000 });
  expect((await gk(page)).saveOk).toBe(false);
});

test.describe('背包畫面', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('gk.save.v1', JSON.stringify({ version: 1, weapons: { sheepGun: 2 } })));
    await page.goto('./');
    await page.waitForFunction(() => window.__GK__?.screen === 'mode-select', undefined, { timeout: 15000 });
    await page.locator('canvas').click({ position: { x: 5, y: 5 } });
    await page.keyboard.press('Digit4');
    await page.waitForFunction(() => window.__GK__?.screen === 'backpack');
  });

  test('背包顯示拿到的武器與星等', async ({ page }) => {
    const text = (await gk(page)).backpackText!.join('\n');
    expect(text).toContain('數羊機槍');
    expect(text).toContain('★★☆');
    expect(text).toContain('???');
    expect(text).toContain('R 70%');
  });

  test('按 Escape 回到開場選單', async ({ page }) => {
    await page.keyboard.press('Escape');
    await page.waitForFunction(() => window.__GK__?.screen === 'mode-select');
  });
});
