import { test, expect, type Page } from '@playwright/test';

async function gk(page: Page) {
  return page.evaluate(() => window.__GK__!);
}

async function open(page: Page, level: string, mode = 'single'): Promise<void> {
  await page.goto(`./?mode=${mode}&test=1&level=${level}`);
  await page.waitForFunction(() => window.__GK__?.screen === 'range', undefined, { timeout: 30000 });
  await page.locator('canvas').click({ position: { x: 5, y: 5 } });
}

async function calm(page: Page): Promise<void> {
  await page.evaluate(() => window.__GK__!.defeatAll!());
}

const y0 = async (page: Page): Promise<number> => (await gk(page)).players![0].y;

test.describe('世界 3 亞特蘭提斯海底王國', () => {
  for (const level of ['w3-1', 'w3-2', 'w3-3']) {
    test(`${level} 有圖、沒有缺圖`, async ({ page }) => {
      await open(page, level);
      const s = await gk(page);
      expect(s.level).toBe(level);
      expect(s.art!.missing).toEqual([]);
      expect(s.music).toBe(level === 'w3-1' ? 'day' : level === 'w3-2' ? 'dusk' : 'night');
    });
  }

  test('按住跳躍往上游,放開慢慢沉下去', async ({ page }) => {
    await open(page, 'w3-1');
    await page.waitForTimeout(300);
    await page.keyboard.down('KeyV');
    await page.waitForTimeout(700);
    await page.keyboard.up('KeyV');
    const top = await y0(page);
    expect(top).toBeLessThan(400);
    await page.waitForTimeout(1200);
    expect(await y0(page)).toBeGreaterThan(top + 30);
  });

  test('不能游出水面', async ({ page }) => {
    await open(page, 'w3-1');
    await page.keyboard.down('KeyV');
    await page.waitForTimeout(3500);
    expect(await y0(page)).toBeGreaterThanOrEqual(69);
    await page.keyboard.up('KeyV');
    expect((await gk(page)).restarts).toBe(0);
  });

  test('按住下往下潛比放開沉得快', async ({ page }) => {
    await open(page, 'w3-1');
    const sinkFor = async (dive: boolean): Promise<number> => {
      await page.keyboard.down('KeyV');
      await page.waitForTimeout(900);
      await page.keyboard.up('KeyV');
      await page.waitForTimeout(250);
      const a = await y0(page);
      if (dive) await page.keyboard.down('KeyS');
      await page.waitForTimeout(400);
      if (dive) await page.keyboard.up('KeyS');
      return (await y0(page)) - a;
    };
    const slow = await sinkFor(false);
    await page.waitForTimeout(2500);
    const fast = await sinkFor(true);
    expect(fast).toBeGreaterThan(slow + 20);
  });

  test('水流把人推著走', async ({ page }) => {
    await open(page, 'w3-2');
    await page.evaluate(() => window.__GK__!.warp!(1100));
    await calm(page);
    await page.waitForTimeout(200);
    const x = (await gk(page)).players![0].x;
    await page.waitForTimeout(1000);
    expect((await gk(page)).players![0].x).toBeGreaterThan(x + 40);
  });

  test('氣泡柱把人往上送', async ({ page }) => {
    await open(page, 'w3-3');
    await page.evaluate(() => window.__GK__!.warp!(2295));
    await calm(page);
    await page.waitForFunction(() => window.__GK__!.players![0].y < 300, undefined, { timeout: 3000 });
  });

  test('河豚被打到會膨脹,膨脹時子彈彈開', async ({ page }) => {
    await open(page, 'w3-1');
    await page.evaluate(() => window.__GK__!.warp!(600));
    await calm(page);
    await page.evaluate(() => window.__GK__!.spawn!('puffer', 520 + 300, 450));
    await page.waitForTimeout(1300);
    const before = (await gk(page)).blockedShots!;
    await page.keyboard.down('KeyC');
    await page.waitForFunction(() => window.__GK__!.enemies!.some((e) => e.type === 'puffer' && e.phase === 'puff'), undefined, { timeout: 4000 });
    await page.waitForTimeout(500);
    await page.keyboard.up('KeyC');
    expect((await gk(page)).blockedShots!).toBeGreaterThan(before);
  });

  test('電鰻放電打到會扣愛心', async ({ page }) => {
    await open(page, 'w3-2');
    await page.evaluate(() => window.__GK__!.warp!(9700));
    await page.waitForFunction(() => window.__GK__!.boss?.type === 'eel', undefined, { timeout: 8000 });
    await page.waitForFunction(() => window.__GK__!.boss!.mode === 'zap', undefined, { timeout: 8000 });
    await page.waitForFunction(() => window.__GK__!.players![0].hearts < 6, undefined, { timeout: 2000 });
  });

  test('寄居蟹縮進殼裡時子彈彈開', async ({ page }) => {
    await open(page, 'w3-1');
    await page.evaluate(() => window.__GK__!.warp!(9700));
    await page.waitForFunction(() => window.__GK__!.boss?.type === 'hermitCrab', undefined, { timeout: 8000 });
    await page.waitForFunction(() => window.__GK__!.boss!.armored, undefined, { timeout: 8000 });
    const hp = (await gk(page)).boss!.hp;
    await page.evaluate(() => window.__GK__!.hurtBoss!(0));
    await page.keyboard.down('KeyC');
    await page.waitForTimeout(300);
    await page.keyboard.up('KeyC');
    const s = await gk(page);
    if (s.boss!.armored) expect(s.boss!.hp).toBe(hp);
  });

  for (const [level, boss] of [
    ['w3-1', 'hermitCrab'],
    ['w3-2', 'eel'],
    ['w3-3', 'nessie'],
  ] as const) {
    test(`${level} ${boss} 打得倒,通關存檔`, async ({ page }) => {
      await page.addInitScript(() => localStorage.removeItem('gk.save.v1'));
      await open(page, level);
      await page.evaluate(() => window.__GK__!.warp!(9700));
      await page.waitForFunction((b) => window.__GK__!.boss?.type === b, boss, { timeout: 8000 });
      await page.waitForTimeout(2500);
      await page.evaluate(() => window.__GK__!.hurtBoss!(9999));
      await page.waitForFunction(() => window.__GK__!.screen === 'complete', undefined, { timeout: 8000 });
      const save = await page.evaluate(() => JSON.parse(localStorage.getItem('gk.save.v1')!));
      expect(save.cleared[level]).toBeGreaterThan(0);
    });
  }

  test('尼斯湖水怪換階段、會出招', async ({ page }) => {
    await open(page, 'w3-3');
    await page.evaluate(() => window.__GK__!.warp!(9700));
    await page.waitForFunction(() => window.__GK__!.boss?.type === 'nessie', undefined, { timeout: 8000 });
    await page.evaluate(() => window.__GK__!.hurtBoss!(90));
    await page.waitForFunction(() => window.__GK__!.boss!.phase === 2, undefined, { timeout: 3000 });
    await page.waitForFunction(() => ['windup', 'charge'].includes(window.__GK__!.boss!.mode) || (window.__GK__!.enemyShots ?? 0) > 0, undefined, { timeout: 8000 });
  });

  test('雙人:各自游,互不影響', async ({ page }) => {
    await open(page, 'w3-1', 'duo');
    await page.waitForTimeout(300);
    await page.keyboard.down('KeyV');
    await page.waitForTimeout(700);
    await page.keyboard.up('KeyV');
    const ps = (await gk(page)).players!;
    expect(ps[0].y).toBeLessThan(400);
    expect(ps[1].y).toBeGreaterThan(470);
  });
});

test('選關:通過 2-3 才開放世界 3', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.removeItem('gk.test.v1');
    localStorage.setItem('gk.save.v1', JSON.stringify({ version: 1, weapons: {}, cleared: { 'w1-1': 1, 'w1-2': 1, forest: 1, 'w2-1': 1, 'w2-2': 1, 'w2-3': 1 } }));
  });
  await page.goto('./?test=1');
  await page.waitForFunction(() => window.__GK__?.screen === 'mode-select', undefined, { timeout: 15000 });
  await page.locator('canvas').click({ position: { x: 5, y: 5 } });
  await page.keyboard.press('Digit1');
  await page.waitForFunction(() => window.__GK__!.screen === 'level-select');
  const s = await gk(page);
  expect(s.world).toBe(3);
  expect(s.levels!.map((l) => [l.id, l.unlocked])).toEqual([
    ['w3-1', true],
    ['w3-2', false],
    ['w3-3', false],
  ]);
});

test('咖啡章魚從畫面外進來,會留在畫面裡(戰鬥區清得完)', async ({ page }) => {
  await page.goto('./?mode=single&test=1&level=w3-2');
  await page.waitForFunction(() => window.__GK__?.screen === 'range', undefined, { timeout: 30000 });
  await page.locator('canvas').click({ position: { x: 5, y: 5 } });
  await page.evaluate(() => window.__GK__!.warp!(800));
  await page.evaluate(() => window.__GK__!.defeatAll!());
  const cam = (await page.evaluate(() => window.__GK__!.cameraX))!;
  await page.evaluate((x) => window.__GK__!.spawn!('octopus', x, 300), cam - 20);
  await page.evaluate((x) => window.__GK__!.spawn!('octopus', x, 300), cam + 980);
  await page.waitForTimeout(600);
  const xs = (await page.evaluate(() => window.__GK__!.enemies!)).filter((e) => e.type === 'octopus').map((e) => e.x);
  const camNow = (await page.evaluate(() => window.__GK__!.cameraX))!;
  for (const x of xs) {
    expect(x).toBeGreaterThanOrEqual(camNow + 20);
    expect(x).toBeLessThanOrEqual(camNow + 940);
  }
});
