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
    for (const name of ['shootBubble', 'hit', 'sleep', 'jump', 'hurt']) expect(sfx[name] ?? 0, name).toBeGreaterThan(0);
  });

  test('連射時每一發都有射擊聲(機槍「噠」)', async ({ page }) => {
    await open(page);
    await page.evaluate(() => window.__GK__!.giveWeapon!(0, 'sheepGun', 1));
    await page.keyboard.down('KeyC');
    await page.waitForTimeout(1000);
    await page.keyboard.up('KeyC');
    // 約 14 發,每一發都發出聲音(射擊聲的間隔比射擊間隔短;沒有魔物,只有射擊聲)。
    // 最前面一兩發可能在瀏覽器還沒開好聲音時射出。
    const s = await gk(page);
    expect(s.sfx!.shootSheep ?? 0).toBeGreaterThan(10);
    expect(s.voices!).toBeGreaterThanOrEqual(s.sfx!.shootSheep! - 3);
  });

  test('每一關播自己世界、自己時段的配樂(錄音檔),關主戰換成關主曲', async ({ page }) => {
    await open(page, './?mode=single&test=1&level=w1-1');
    expect((await gk(page)).music).toBe('w01-day');
    await page.waitForFunction(() => window.__GK__!.musicSource === 'recorded', undefined, { timeout: 15000 });
    await page.evaluate(() => window.__GK__!.warp!(window.__GK__!.bossLockX! + 500));
    await page.waitForFunction(() => window.__GK__!.music === 'w01-boss', undefined, { timeout: 15000 });
  });

  test('主選單播美術組的主選單曲(錄音檔)', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('gk.save.v1', JSON.stringify({ version: 1, weapons: {}, story: { opening: true } })));
    await page.goto('./?test=1');
    await page.waitForFunction(() => window.__GK__?.screen === 'mode-select', undefined, { timeout: 15000 });
    await page.locator('canvas').click({ position: { x: 5, y: 5 } });
    expect((await gk(page)).music).toBe('menu');
    await page.waitForFunction(() => window.__GK__!.musicSource === 'recorded', undefined, { timeout: 15000 });
  });

  test('世界 3 黃昏的關卡播世界 3 的黃昏曲;世界 3 的關主戰用晚上那首', async ({ page }) => {
    await open(page, './?mode=single&test=1&level=w3-2');
    expect((await gk(page)).music).toBe('w03-dusk');
    await page.waitForFunction(() => window.__GK__!.musicSource === 'recorded', undefined, { timeout: 15000 });
    await page.evaluate(() => window.__GK__!.warp!(window.__GK__!.bossLockX! + 500));
    await page.waitForFunction(() => window.__GK__!.music === 'w03-boss', undefined, { timeout: 15000 });
  });

  test('真的有發出聲音;全部靜音後完全沒有', async ({ page }) => {
    await page.addInitScript(() => {
      if (sessionStorage.getItem('muted')) localStorage.setItem('gk.settings.v1', JSON.stringify({ music: 6, sfx: 8, muted: true }));
      else localStorage.removeItem('gk.settings.v1');
    });
    await open(page);
    await page.keyboard.down('KeyC');
    await page.waitForTimeout(600);
    await page.keyboard.up('KeyC');
    expect((await gk(page)).voices!).toBeGreaterThan(0);
    await page.evaluate(() => sessionStorage.setItem('muted', '1'));
    await open(page);
    await page.keyboard.down('KeyC');
    await page.waitForTimeout(600);
    await page.keyboard.up('KeyC');
    const s = await gk(page);
    expect(s.sfx!.shootBubble ?? 0).toBeGreaterThan(0);
    expect(s.voices).toBe(0);
  });

  test('換關、重來後只有一首配樂在播', async ({ page }) => {
    await open(page, './?mode=single&test=1&level=w1-1');
    await page.evaluate(() => window.__GK__!.warp!(window.__GK__!.bossLockX! + 500));
    await page.waitForFunction(() => window.__GK__!.music === 'w01-boss', undefined, { timeout: 15000 });
    await page.waitForTimeout(1000);
    expect((await gk(page)).musicTracks).toBe(1);
    // 直接睡著(受傷有無敵時間,連打只會扣一顆)。
    await page.evaluate(() => window.__GK__!.knockOut!(0));
    // 等真的重來了(睡著後還要一下子才會重來),再看配樂。
    await page.waitForFunction(() => (window.__GK__!.restarts ?? 0) >= 1 && window.__GK__!.screen === 'range', undefined, { timeout: 15000 });
    // 換配樂時舊的會淡出一下(兩首重疊是正常的);要確認的是舊的最後一定會停,不會一直疊上去。
    await page.waitForFunction(() => (window.__GK__!.musicTracks ?? 0) <= 1, undefined, { timeout: 6000 });
    await page.waitForTimeout(1000);
    expect((await gk(page)).musicTracks).toBeLessThanOrEqual(1);
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
    // 網頁版在「清除」上面多了匯出/匯入存檔那一列:一直往下按到「清除」
    for (let i = 0; i < 8 && (await page.evaluate(() => window.__GK__!.settingsRow)) !== 'clear'; i++) await page.keyboard.press('ArrowDown');
    await page.waitForFunction(() => window.__GK__!.settingsRow === 'clear');
    await page.keyboard.press('Enter');
    let saved = await page.evaluate(() => JSON.parse(localStorage.getItem('gk.save.v1')!));
    expect(saved.weapons.sheepGun).toBe(2);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(200);
    saved = await page.evaluate(() => JSON.parse(localStorage.getItem('gk.save.v1')!));
    expect(saved).toEqual({ version: 1, weapons: {}, cleared: {}, story: { opening: false, ending: false, intros: [] } });
    const guards = await page.evaluate(() => JSON.parse(localStorage.getItem('gk.guards.v1') ?? 'null'));
    expect(guards?.guards ?? []).toEqual([]);
  });
});
