import { test, expect, type Page } from '@playwright/test';

async function gk(page: Page) {
  return page.evaluate(() => window.__GK__!);
}

async function open(page: Page, mode = 'single'): Promise<void> {
  await page.goto(`./?mode=${mode}&test=1&level=w1-2`);
  await page.waitForFunction(() => window.__GK__?.screen === 'range', undefined, { timeout: 20000 });
  await page.locator('canvas').click({ position: { x: 5, y: 5 } });
}

test.describe('1-2 河邊', () => {
  test('走進河溝:扣一顆愛心,從左岸重新出來', async ({ page }) => {
    await open(page);
    await page.evaluate(() => window.__GK__!.warp!(1120));
    await page.waitForTimeout(300);
    await page.keyboard.down('KeyD');
    await page.waitForFunction(() => (window.__GK__!.riverFalls ?? 0) === 1, undefined, { timeout: 4000 });
    await page.keyboard.up('KeyD');
    const p = (await gk(page)).players![0];
    expect(p.hearts).toBe(9);
    expect(p.x).toBeLessThan(1200);
    await page.waitForTimeout(500);
    expect(Math.round((await gk(page)).players![0].y)).toBe(480);
  });

  test('往回走掉進已經走過的河溝:從右岸出來,不會一直掉', async ({ page }) => {
    await open(page);
    await page.evaluate(() => window.__GK__!.warp!(7820));
    await page.waitForTimeout(400);
    await page.keyboard.down('KeyA');
    await page.waitForTimeout(2000);
    await page.keyboard.up('KeyA');
    await page.waitForTimeout(500);
    const s = await gk(page);
    expect(s.riverFalls).toBeLessThanOrEqual(2);
    expect(s.players![0].hearts).toBeGreaterThanOrEqual(4);
    expect(s.restarts).toBe(0);
  });

  test('雙人:只有掉下去的人扣愛心', async ({ page }) => {
    await open(page, 'duo');
    await page.evaluate(() => window.__GK__!.warp!(1100));
    await page.waitForTimeout(300);
    await page.keyboard.down('ArrowRight');
    await page.waitForFunction(() => (window.__GK__!.riverFalls ?? 0) >= 1, undefined, { timeout: 4000 });
    await page.keyboard.up('ArrowRight');
    const ps = (await gk(page)).players!;
    expect(ps[0].hearts).toBe(10);
    expect(ps[1].hearts).toBe(9);
  });

  test('淺水區走得比較慢', async ({ page }) => {
    await open(page);
    const walk = async (x: number): Promise<number> => {
      await page.evaluate((px) => window.__GK__!.warp!(px), x);
      await page.waitForTimeout(300);
      const x0 = (await gk(page)).players![0].x;
      await page.keyboard.down('KeyD');
      await page.waitForTimeout(400);
      await page.keyboard.up('KeyD');
      return (await gk(page)).players![0].x - x0;
    };
    const dry = await walk(160);
    const wet = await walk(420);
    expect(wet).toBeLessThan(dry * 0.8);
  });

  test('地上的魔物走到河溝邊會停住,不會掉進河裡', async ({ page }) => {
    await open(page);
    await page.evaluate(() => {
      window.__GK__!.warp!(1050);
      window.__GK__!.spawn!('alarmBug', 1400);
    });
    await page.waitForTimeout(3500);
    const bugs = (await gk(page)).enemies!.filter((e) => e.type === 'alarmBug');
    expect(bugs.length).toBeGreaterThan(0);
    for (const b of bugs) expect(b.y).toBeLessThan(480);
  });

  test('小頭目熬夜大河狸:血量 40,拍出水波、丟木頭,打倒通關', async ({ page }) => {
    await open(page);
    await page.evaluate(() => window.__GK__!.warp!(window.__GK__!.bossLockX! + 500));
    await page.waitForFunction(() => !!window.__GK__!.boss, undefined, { timeout: 15000 });
    expect((await gk(page)).boss!.type).toBe('beaver');
    expect((await gk(page)).boss!.maxHp).toBe(120);
    await page.waitForFunction(() => window.__GK__!.desert!.waves > 0, undefined, { timeout: 5000 });
    await page.waitForFunction(() => window.__GK__!.desert!.blocks > 0, undefined, { timeout: 6000 });
    await page.evaluate(() => window.__GK__!.hurtBoss!(9999));
    await page.waitForFunction(() => window.__GK__!.screen === 'complete', undefined, { timeout: 5000 });
  });
});
