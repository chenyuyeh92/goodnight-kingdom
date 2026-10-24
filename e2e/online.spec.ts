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
  expect(code).toMatch(/^\d{6}$/);
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
    const before = (await gk(host)).players!;
    await guest.keyboard.down('KeyD');
    await host.waitForFunction((x0) => window.__GK__!.players![1].x - x0 > 80, before[1].x, { timeout: 8000 });
    await guest.keyboard.up('KeyD');
    // 玩家 A 沒有被朋友的操作影響。
    expect(Math.abs((await gk(host)).players![0].x - before[0].x)).toBeLessThan(10);
  });

  test('朋友按「離開」再加入同一個號碼:又連回來,還是操控玩家 B', async ({ context }) => {
    test.setTimeout(90000);
    const { host, code } = await openRoom(context);
    const guest = await joinRoom(context, code);
    await guest.waitForFunction(() => window.__GK__?.guest?.state === 'connected', undefined, { timeout: 15000 });
    await host.waitForFunction(() => window.__GK__?.screen === 'level-select');
    await host.keyboard.press('Digit1');
    await host.waitForFunction(() => window.__GK__?.screen === 'range' && window.__GK__.players?.length === 2, undefined, { timeout: 15000 });
    await guest.click('#guest-leave');
    await guest.waitForFunction(() => window.__GK__?.screen === 'mode-select', undefined, { timeout: 15000 });
    await host.waitForFunction(() => window.__GK__?.screen === 'range');
    // 房主那邊不用等瀏覽器發現斷線,朋友重新加入馬上可以進來(不會說房間滿了)。
    await guest.locator('canvas').click({ position: { x: 5, y: 5 } });
    await guest.keyboard.press('Digit2');
    await guest.waitForFunction(() => window.__GK__?.onlineChoice === true);
    await guest.keyboard.press('Digit3');
    await guest.waitForFunction(() => window.__GK__?.screen === 'online');
    for (const d of code) await guest.keyboard.press(`Digit${d}`);
    await guest.keyboard.press('Enter');
    await guest.waitForFunction(() => window.__GK__?.guest?.state === 'connected', undefined, { timeout: 20000 });
    // 剛連上時操作的通道可能晚一點才開:按住右,等玩家 B 走起來。
    const startX = (await gk(host)).players![1].x;
    await guest.keyboard.down('KeyD');
    await host.waitForFunction((x0) => window.__GK__!.players![1].x - x0 > 80, startX, { timeout: 8000 });
    await guest.keyboard.up('KeyD');
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
    await third.waitForFunction(() => window.__GK__?.guest?.state === 'full', undefined, { timeout: 20000 });
  });

  test('號碼沒有人開:顯示找不到房間', async ({ context }) => {
    test.setTimeout(40000);
    const guest = await joinRoom(context, '000000');
    await guest.waitForFunction(() => window.__GK__?.guest?.state === 'notFound', undefined, { timeout: 20000 });
  });
});
