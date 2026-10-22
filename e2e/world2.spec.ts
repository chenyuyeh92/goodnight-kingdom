import { test, expect, type Page } from '@playwright/test';

async function gk(page: Page) {
  return page.evaluate(() => window.__GK__!);
}

async function open(page: Page, level: string, extra = '', mode = 'single'): Promise<void> {
  await page.goto(`./?mode=${mode}&test=1&level=${level}${extra}`);
  await page.waitForFunction(() => window.__GK__?.screen === 'range', undefined, { timeout: 30000 });
  await page.locator('canvas').click({ position: { x: 5, y: 5 } });
}

/** 讓附近的魔物都睡著,測試機關時不被打擾。 */
async function calm(page: Page): Promise<void> {
  await page.evaluate(() => window.__GK__!.defeatAll!());
}

test.describe('世界 2 沙漠金字塔王國', () => {
  for (const level of ['w2-1', 'w2-2', 'w2-3']) {
    test(`${level} 有圖、沒有缺圖`, async ({ page }) => {
      await open(page, level);
      const s = await gk(page);
      expect(s.level).toBe(level);
      expect(s.art!.missing).toEqual([]);
      expect(s.music).toBe(level === 'w2-1' ? 'day' : level === 'w2-2' ? 'dusk' : 'night');
    });
  }

  test('沒有圖(?noart=1)也能玩到關主', async ({ page }) => {
    await open(page, 'w2-3', '&noart=1');
    await page.evaluate(() => window.__GK__!.warp!(9700));
    await page.waitForFunction(() => window.__GK__!.boss?.type === 'sphinx', undefined, { timeout: 8000 });
    await page.evaluate(() => window.__GK__!.hurtBoss!(9999));
    await page.waitForFunction(() => window.__GK__!.screen === 'complete', undefined, { timeout: 8000 });
  });

  test('流沙裡走得比較慢', async ({ page }) => {
    await open(page, 'w2-2');
    const walk = async (x: number): Promise<number> => {
      await page.evaluate((px) => window.__GK__!.warp!(px), x);
      await calm(page);
      await page.waitForTimeout(300);
      const x0 = (await gk(page)).players![0].x;
      await page.keyboard.down('KeyD');
      await page.waitForTimeout(400);
      await page.keyboard.up('KeyD');
      return (await gk(page)).players![0].x - x0;
    };
    const inSand = await walk(1910);
    const outside = await walk(2600);
    expect(inSand).toBeLessThan(outside * 0.7);
  });

  test('站在流沙裡太久會陷下去扣一顆愛心,彈出來', async ({ page }) => {
    await open(page, 'w2-2');
    await page.evaluate(() => window.__GK__!.warp!(2000));
    await calm(page);
    await page.waitForFunction(() => (window.__GK__!.desert?.sink[0] ?? 0) > 500, undefined, { timeout: 3000 });
    await page.waitForFunction(() => window.__GK__!.desert!.sinks === 1, undefined, { timeout: 3000 });
    const s = await gk(page);
    expect(s.players![0].hearts).toBeLessThanOrEqual(5);
    // 陷下去後重新計時,不會連續扣血。
    expect(s.desert!.sink[0]).toBeLessThan(500);
    expect(s.restarts).toBe(0);
  });

  test('踩到壓力板:先有影子,沙磚掉下來落地當平台,過一陣子碎掉', async ({ page }) => {
    await open(page, 'w2-3');
    await page.evaluate(() => window.__GK__!.warp!(800));
    await page.waitForFunction(() => window.__GK__!.desert!.platesFired === 1, undefined, { timeout: 3000 });
    expect((await gk(page)).desert!.blocks).toBe(2);
    // 站著不動(還在壓力板上)也要等 3 秒才會再觸發。
    await page.waitForTimeout(1500);
    expect((await gk(page)).desert!.platesFired).toBe(1);
    // 走開,不再踩到壓力板。
    await page.evaluate(() => window.__GK__!.warp!(1450));
    await page.waitForFunction(() => window.__GK__!.desert!.landed === 2, undefined, { timeout: 4000 });
    await page.waitForFunction(() => window.__GK__!.desert!.blocks === 0, undefined, { timeout: 6000 });
  });

  test('沙磚砸到會扣愛心,落地後玩家不會卡在沙磚裡', async ({ page }) => {
    await open(page, 'w2-1');
    await page.evaluate(() => window.__GK__!.warp!(2000));
    await calm(page);
    await page.waitForTimeout(300);
    const x = (await gk(page)).players![0].x;
    await page.evaluate((px) => window.__GK__!.dropBlock!(px), x);
    await page.waitForFunction(() => window.__GK__!.players![0].hearts === 5, undefined, { timeout: 4000 });
    await page.waitForTimeout(800);
    await page.keyboard.down('KeyD');
    await page.waitForTimeout(600);
    await page.keyboard.up('KeyD');
    expect((await gk(page)).players![0].x).toBeGreaterThan(x + 60);
  });

  test('疊起來的沙磚:下面那塊碎掉,上面那塊掉到地上,不會浮在半空中', async ({ page }) => {
    await open(page, 'w2-1');
    await page.evaluate(() => window.__GK__!.warp!(2000));
    await calm(page);
    await page.evaluate(() => window.__GK__!.dropBlock!(1940));
    await page.waitForFunction(() => window.__GK__!.desert!.bottoms.length === 1, undefined, { timeout: 3000 });
    await page.waitForTimeout(800);
    await page.evaluate(() => window.__GK__!.dropBlock!(1940));
    await page.waitForFunction(() => window.__GK__!.desert!.bottoms.includes(442), undefined, { timeout: 3000 });
    // 下面那塊碎掉後,上面那塊落到地面(底部 480)。
    await page.waitForFunction(() => window.__GK__!.desert!.bottoms.length === 1 && window.__GK__!.desert!.bottoms[0] === 480, undefined, { timeout: 5000 });
  });

  test('雙人:只有陷進流沙的人扣愛心', async ({ page }) => {
    await open(page, 'w2-2', '', 'duo');
    await page.evaluate(() => window.__GK__!.warp!(1960));
    await calm(page);
    // A 站在流沙(1960),B 在右邊 40(2000)也在流沙;B 先走出去。
    await page.keyboard.down('ArrowRight');
    await page.waitForTimeout(1300);
    await page.keyboard.up('ArrowRight');
    await page.waitForFunction(() => window.__GK__!.desert!.sinks >= 1, undefined, { timeout: 4000 });
    expect((await gk(page)).desert!.sinks).toBe(1);
    const ps = (await gk(page)).players!;
    expect(ps[0].hearts).toBeLessThan(6);
    expect(ps[1].hearts).toBe(6);
  });

  for (const [level, boss, next] of [
    ['w2-1', 'camel', 'w2-2'],
    ['w2-2', 'fennec', 'w2-3'],
    ['w2-3', 'sphinx', null],
  ] as const) {
    test(`${level} 小頭目/關主 ${boss} 打得倒,通關存檔`, async ({ page }) => {
      await page.addInitScript(() => localStorage.removeItem('gk.save.v1'));
      await open(page, level);
      await page.evaluate(() => window.__GK__!.warp!(9700));
      await page.waitForFunction((b) => window.__GK__!.boss?.type === b, boss, { timeout: 8000 });
      await page.waitForTimeout(3000);
      const s = await gk(page);
      expect(s.boss!.hp).toBe(s.boss!.maxHp);
      await page.evaluate(() => window.__GK__!.hurtBoss!(9999));
      await page.waitForFunction(() => window.__GK__!.screen === 'complete', undefined, { timeout: 8000 });
      const save = await page.evaluate(() => JSON.parse(localStorage.getItem('gk.save.v1')!));
      expect(save.cleared[level]).toBeGreaterThan(0);
      expect(next === null || save.cleared[next] === undefined).toBe(true);
    });
  }

  test('人面獅身:換階段時說「人面獅身越來越暴躁了!」,會出招', async ({ page }) => {
    await open(page, 'w2-3');
    await page.evaluate(() => window.__GK__!.warp!(9700));
    await page.waitForFunction(() => window.__GK__!.boss?.type === 'sphinx', undefined, { timeout: 8000 });
    await page.evaluate(() => window.__GK__!.hurtBoss!(30));
    await page.waitForFunction(() => window.__GK__!.boss!.phase === 2, undefined, { timeout: 3000 });
    await page.waitForTimeout(300);
    expect((await page.evaluate(() => window.__GK__!.enemies!)).find((e) => e.type === 'sphinx')!.artKey).toBe('sphinx-2');
    await page.waitForFunction(() => (window.__GK__!.desert!.blocks ?? 0) > 0 || (window.__GK__!.enemyShots ?? 0) > 0 || (window.__GK__!.desert!.waves ?? 0) > 0, undefined, { timeout: 8000 });
  });

  test('耳廓狐鑽進沙裡時打不到', async ({ page }) => {
    await open(page, 'w2-2');
    await page.evaluate(() => window.__GK__!.warp!(9700));
    await page.waitForFunction(() => window.__GK__!.boss?.hidden === true, undefined, { timeout: 10000 });
    const hp = (await gk(page)).boss!.hp;
    await page.keyboard.down('KeyC');
    await page.waitForTimeout(300);
    await page.keyboard.up('KeyC');
    const s = await gk(page);
    if (s.boss!.hidden) expect(s.boss!.hp).toBe(hp);
  });
});

test.describe('選關切換世界', () => {
  async function openLevelSelect(page: Page, cleared: object): Promise<void> {
    await page.addInitScript((c) => localStorage.setItem('gk.save.v1', JSON.stringify({ version: 1, weapons: {}, cleared: c })), cleared);
    await page.goto('./?test=1');
    await page.waitForFunction(() => window.__GK__?.screen === 'mode-select', undefined, { timeout: 15000 });
    await page.locator('canvas').click({ position: { x: 5, y: 5 } });
    await page.keyboard.press('Digit1');
    await page.waitForFunction(() => window.__GK__!.screen === 'level-select');
  }

  test('還沒通過 1-3:世界 2 全部鎖住', async ({ page }) => {
    await openLevelSelect(page, { 'w1-1': 1, 'w1-2': 1 });
    expect((await gk(page)).world).toBe(1);
    await page.keyboard.press('KeyE');
    await page.waitForFunction(() => window.__GK__!.world === 2);
    expect((await gk(page)).levels!.map((l) => l.unlocked)).toEqual([false, false, false]);
    await page.keyboard.press('Digit1');
    await page.waitForTimeout(300);
    expect((await gk(page)).screen).toBe('level-select');
  });

  test('通過 1-3 後直接顯示世界 2,可以玩 2-1;Q 回到世界 1', async ({ page }) => {
    await openLevelSelect(page, { 'w1-1': 1, 'w1-2': 1, forest: 1 });
    const s = await gk(page);
    expect(s.world).toBe(2);
    expect(s.levels!.map((l) => [l.id, l.unlocked])).toEqual([
      ['w2-1', true],
      ['w2-2', false],
      ['w2-3', false],
    ]);
    await page.keyboard.press('KeyQ');
    await page.waitForFunction(() => window.__GK__!.world === 1);
    await page.keyboard.press('ArrowRight');
    await page.waitForFunction(() => window.__GK__!.world === 2);
    await page.keyboard.press('Digit1');
    await page.waitForFunction(() => window.__GK__!.screen === 'range' || window.__GK__!.screen === 'loadout');
  });
});
