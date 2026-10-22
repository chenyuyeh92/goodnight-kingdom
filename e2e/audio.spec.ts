import { test, expect, type Page } from '@playwright/test';

async function gk(page: Page) {
  return page.evaluate(() => window.__GK__!);
}

async function open(page: Page, path = './?mode=single&test=1&level=range'): Promise<void> {
  await page.goto(path);
  await page.waitForFunction(() => window.__GK__?.screen === 'range', undefined, { timeout: 20000 });
  await page.locator('canvas').click({ position: { x: 5, y: 5 } });
}

test.describe('聲音', () => {
  test('射擊、打倒魔物、受傷、跳躍都有音效', async ({ page }) => {
    await open(page);
    await page.evaluate(() => window.__GK__!.spawn!('alarmBug', 450));
    await page.keyboard.down('KeyC');
    await page.waitForFunction(() => window.__GK__!.enemiesDefeated === 1, undefined, { timeout: 4000 });
    await page.keyboard.up('KeyC');
    await page.keyboard.press('KeyV');
    await page.evaluate(() => window.__GK__!.hurt!(0));
    await page.waitForTimeout(200);
    const sfx = (await gk(page)).sfx!;
    for (const name of ['shoot', 'hit', 'sleep', 'jump', 'hurt']) expect(sfx[name] ?? 0, name).toBeGreaterThan(0);
  });

  test('連射時射擊聲有限制頻率', async ({ page }) => {
    await open(page);
    await page.evaluate(() => window.__GK__!.giveWeapon!(0, 'sheepGun', 1));
    await page.keyboard.down('KeyC');
    await page.waitForTimeout(1000);
    await page.keyboard.up('KeyC');
    const sfx = (await gk(page)).sfx!;
    expect(sfx.shoot ?? 0).toBeGreaterThan(5);
    expect(sfx.shoot ?? 0).toBeLessThanOrEqual(12);
  });

  test('每一關播自己的配樂,關主戰換成關主曲', async ({ page }) => {
    await open(page, './?mode=single&test=1&level=w1-1');
    expect((await gk(page)).music).toBe('day');
    await page.evaluate(() => window.__GK__!.warp!(window.__GK__!.bossLockX! + 500));
    await page.waitForFunction(() => window.__GK__!.music === 'boss', undefined, { timeout: 15000 });
  });

  test('設定:調音量、靜音,重新整理後還在', async ({ page }) => {
    await page.goto('./?test=1');
    await page.waitForFunction(() => window.__GK__?.screen === 'mode-select', undefined, { timeout: 15000 });
    await page.locator('canvas').click({ position: { x: 5, y: 5 } });
    await page.keyboard.press('Digit5');
    await page.waitForFunction(() => window.__GK__!.screen === 'settings');
    const music0 = (await gk(page)).settings!.music;
    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    await page.waitForFunction(() => window.__GK__!.settings!.muted === true);
    expect((await gk(page)).settings!.music).toBe(music0 - 2);
    await page.reload();
    await page.waitForFunction(() => window.__GK__?.screen === 'mode-select', undefined, { timeout: 15000 });
    await page.locator('canvas').click({ position: { x: 5, y: 5 } });
    await page.keyboard.press('Digit5');
    await page.waitForFunction(() => window.__GK__!.screen === 'settings');
    expect((await gk(page)).settings).toMatchObject({ music: music0 - 2, muted: true });
  });

  test('清除存檔要按兩次,背包與通關紀錄都清掉', async ({ page }) => {
    await page.addInitScript(() => {
      if (sessionStorage.getItem('seeded')) return;
      sessionStorage.setItem('seeded', '1');
      localStorage.setItem('gk.save.v1', JSON.stringify({ version: 1, weapons: { sheepGun: 2 }, cleared: { 'w1-1': 100000 } }));
    });
    await page.goto('./?test=1');
    await page.waitForFunction(() => window.__GK__?.screen === 'mode-select', undefined, { timeout: 15000 });
    await page.locator('canvas').click({ position: { x: 5, y: 5 } });
    await page.keyboard.press('Digit5');
    await page.waitForFunction(() => window.__GK__!.screen === 'settings');
    for (let i = 0; i < 3; i++) await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    let saved = await page.evaluate(() => JSON.parse(localStorage.getItem('gk.save.v1')!));
    expect(saved.weapons.sheepGun).toBe(2);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(200);
    saved = await page.evaluate(() => JSON.parse(localStorage.getItem('gk.save.v1')!));
    expect(saved).toEqual({ version: 1, weapons: {}, cleared: {} });
  });
});
