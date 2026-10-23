import { test, expect, type Page } from '@playwright/test';

async function gk(page: Page) {
  return page.evaluate(() => window.__GK__!);
}

async function open(page: Page, mode = 'single'): Promise<void> {
  await page.goto(`./?mode=${mode}&test=1&level=lab`);
  await page.waitForFunction(() => window.__GK__?.screen === 'range', undefined, { timeout: 30000 });
  await page.locator('canvas').click({ position: { x: 5, y: 5 } });
}

/** 把角色放到第 i 個移動平台上面(從平台上方一點點落下)。 */
async function onMover(page: Page, i: number): Promise<void> {
  const m = (await gk(page)).gadgets!.movers[i];
  await page.evaluate(([x, y]) => window.__GK__!.warp!(x, y), [m.x + 30, m.y - 2] as const);
  await page.waitForTimeout(200);
}

test.describe('新機關', () => {
  test('站上左右移動的平台會被載著走', async ({ page }) => {
    await open(page);
    await onMover(page, 0);
    const x0 = (await gk(page)).players![0].x;
    await page.waitForTimeout(1500);
    const s = await gk(page);
    expect(Math.abs(s.players![0].x - x0)).toBeGreaterThan(60);
    expect(Math.abs(s.players![0].y - s.gadgets!.movers[0].y)).toBeLessThanOrEqual(3);
  });

  test('雙人一起站在移動平台上,兩人都被載著走', async ({ page }) => {
    await open(page, 'duo');
    await onMover(page, 0);
    const p0 = (await gk(page)).players!;
    await page.waitForTimeout(1500);
    const p1 = (await gk(page)).players!;
    expect(Math.abs(p1[0].x - p0[0].x)).toBeGreaterThan(60);
    expect(Math.abs(p1[1].x - p0[1].x)).toBeGreaterThan(60);
  });

  test('上下移動的平台:上去時托著、下來時貼著不會飄起來', async ({ page }) => {
    await open(page);
    await onMover(page, 1);
    let worst = 0;
    for (let i = 0; i < 40; i++) {
      await page.waitForTimeout(100);
      const s = await gk(page);
      worst = Math.max(worst, Math.abs(s.players![0].y - s.gadgets!.movers[1].y));
    }
    expect(worst).toBeLessThanOrEqual(3);
  });

  test('踩到彈跳墊跳得比一般跳高很多', async ({ page }) => {
    await open(page);
    await page.evaluate(() => window.__GK__!.warp!(1600, 360));
    let top = 999;
    for (let i = 0; i < 30; i++) {
      await page.waitForTimeout(50);
      top = Math.min(top, (await gk(page)).players![0].y);
    }
    expect((await gk(page)).gadgets!.bounces).toBeGreaterThanOrEqual(1);
    // 一般跳約 145 px;彈跳墊頂端 462,跳到 220 以上(高 240 以上)。
    expect(top).toBeLessThan(220);
  });

  test('走路經過彈跳墊不會被彈起來(要從上面踩下去才會彈)', async ({ page }) => {
    await open(page);
    await page.evaluate(() => window.__GK__!.warp!(1500));
    await page.keyboard.down('KeyD');
    await page.waitForTimeout(900);
    await page.keyboard.up('KeyD');
    const s = await gk(page);
    expect(s.players![0].x).toBeGreaterThan(1640);
    expect(s.gadgets!.bounces).toBe(0);
  });

  test('站上會掉的平台抖一下就掉,之後長回來;睡著重來時在原位', async ({ page }) => {
    await open(page);
    await page.evaluate(() => window.__GK__!.warp!(2050, 398));
    await page.waitForFunction(() => window.__GK__!.gadgets!.crumbles[0] === 'fallen', undefined, { timeout: 2000 });
    await page.waitForFunction(() => window.__GK__!.players![0].y > 470, undefined, { timeout: 2000 });
    await page.waitForFunction(() => window.__GK__!.gadgets!.crumbles[0] === 'solid', undefined, { timeout: 6000 });
    await page.evaluate(() => window.__GK__!.warp!(2050, 398));
    await page.waitForFunction(() => window.__GK__!.gadgets!.crumbles[0] === 'fallen', undefined, { timeout: 2000 });
    const fellAt = Date.now();
    // 睡著重來(比平台自己長回來的 4 秒快):平台在原位。
    await page.evaluate(() => window.__GK__!.knockOut!(0));
    await page.waitForFunction(() => window.__GK__!.players![0].hearts === 6 && !window.__GK__!.players![0].down, undefined, { timeout: 3000 });
    expect(Date.now() - fellAt).toBeLessThan(4000);
    expect((await gk(page)).gadgets!.crumbles[0]).toBe('solid');
  });
});
