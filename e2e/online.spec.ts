import { test, expect, type Page, type BrowserContext } from '@playwright/test';

// 同一個瀏覽器的兩個分頁當作兩支手機(?net=local:用 BroadcastChannel 交換連線資訊,不連外部網路)。

async function gk(page: Page) {
  return page.evaluate(() => window.__GK__!);
}

async function menu(ctx: BrowserContext): Promise<Page> {
  const page = await ctx.newPage();
  await page.goto('./?net=local&test=1');
  await page.waitForFunction(() => window.__GK__?.screen === 'mode-select', undefined, { timeout: 15000 });
  await page.locator('canvas').click({ position: { x: 5, y: 5 } });
  await page.keyboard.press('Digit2');
  await page.waitForFunction(() => window.__GK__?.onlineChoice === true);
  return page;
}

async function openRoom(ctx: BrowserContext): Promise<{ host: Page; code: string }> {
  const host = await menu(ctx);
  await host.keyboard.press('Digit2');
  await host.waitForFunction(() => window.__GK__?.online?.state === 'waiting', undefined, { timeout: 10000 });
  const code = (await gk(host)).online!.code!;
  expect(code).toMatch(/^\d{4}$/);
  return { host, code };
}

async function joinRoom(ctx: BrowserContext, code: string): Promise<Page> {
  const guest = await menu(ctx);
  await guest.keyboard.press('Digit3');
  await guest.waitForFunction(() => window.__GK__?.screen === 'online');
  for (const d of code) await guest.keyboard.press(`Digit${d}`);
  await guest.waitForFunction((c) => window.__GK__?.online?.code === c, code);
  await guest.keyboard.press('Enter');
  return guest;
}

test.describe('線上雙人(兩台裝置)', () => {
  test.beforeEach(async ({ context }) => {
    await context.addInitScript(() => localStorage.setItem('gk.save.v1', JSON.stringify({ version: 1, weapons: {}, story: { opening: true } })));
  });

  test('房主開房間、朋友輸入號碼加入:朋友看到遊戲畫面,朋友按右,房主那邊的玩家 B 往右走', async ({ context }) => {
    test.setTimeout(60000);
    const { host, code } = await openRoom(context);
    const guest = await joinRoom(context, code);
    await guest.waitForFunction(() => window.__GK__?.guest?.state === 'connected', undefined, { timeout: 15000 });
    await host.waitForFunction(() => window.__GK__?.screen === 'level-select', undefined, { timeout: 10000 });
    // 朋友那台收到房主的畫面。
    await guest.waitForFunction(() => (window.__GK__?.guest?.videoWidth ?? 0) > 0, undefined, { timeout: 10000 });

    await host.keyboard.press('Digit1');
    await host.waitForFunction(() => window.__GK__?.screen === 'range' && window.__GK__.players?.length === 2, undefined, { timeout: 15000 });
    await host.waitForTimeout(500);
    const before = (await gk(host)).players!;
    await guest.keyboard.down('KeyD');
    await guest.waitForTimeout(1000);
    await guest.keyboard.up('KeyD');
    await host.waitForTimeout(200);
    const after = (await gk(host)).players!;
    expect(after[1].x - before[1].x).toBeGreaterThan(80);
    expect(Math.abs(after[0].x - before[0].x)).toBeLessThan(10);
  });

  test('房主回到主選單就關房間;朋友那邊顯示連線中斷', async ({ context }) => {
    test.setTimeout(60000);
    const { host, code } = await openRoom(context);
    const guest = await joinRoom(context, code);
    await host.waitForFunction(() => window.__GK__?.screen === 'level-select', undefined, { timeout: 15000 });
    await host.keyboard.press('Escape');
    await host.waitForFunction(() => window.__GK__?.screen === 'mode-select');
    await guest.waitForFunction(() => window.__GK__?.guest?.state !== 'connected', undefined, { timeout: 15000 });
  });

  test('第三個人加入同一個房間:顯示房間已經滿了', async ({ context }) => {
    test.setTimeout(60000);
    const { host, code } = await openRoom(context);
    const guest = await joinRoom(context, code);
    await guest.waitForFunction(() => window.__GK__?.guest?.state === 'connected', undefined, { timeout: 15000 });
    await host.waitForFunction(() => window.__GK__?.screen === 'level-select');
    const third = await joinRoom(context, code);
    await third.waitForFunction(() => window.__GK__?.guest?.state === 'full', undefined, { timeout: 10000 });
  });

  test('號碼沒有人開:顯示找不到房間', async ({ context }) => {
    test.setTimeout(40000);
    const guest = await joinRoom(context, '0000');
    await guest.waitForFunction(() => window.__GK__?.guest?.state === 'notFound', undefined, { timeout: 20000 });
  });
});
