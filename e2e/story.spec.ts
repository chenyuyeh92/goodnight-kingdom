import { test, expect, type Page } from '@playwright/test';

async function gk(page: Page) {
  return page.evaluate(() => window.__GK__!);
}

async function openMenu(page: Page, save?: object): Promise<void> {
  if (save) await page.addInitScript((s) => localStorage.setItem('gk.save.v1', s), JSON.stringify(save));
  await page.goto('./?test=1&story=1');
  await page.waitForFunction(() => window.__GK__?.screen === 'mode-select', undefined, { timeout: 15000 });
  await page.locator('canvas').click({ position: { x: 5, y: 5 } });
}

/** 一幕點兩下:先把字顯示完,再到下一幕。 */
async function tapThrough(page: Page): Promise<void> {
  for (let i = 0; i < 40 && (await gk(page)).screen === 'story'; i++) {
    await page.keyboard.press('Enter');
    await page.waitForTimeout(60);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(450);
  }
}

test.describe('故事', () => {
  test('第一次開始遊戲先播開場(6 幕),點到底進選關;第二次不播', async ({ page }) => {
    await openMenu(page);
    await page.keyboard.press('Digit1');
    await page.waitForFunction(() => window.__GK__?.screen === 'story', undefined, { timeout: 5000 });
    const s = await gk(page);
    expect(s.story!.beats).toBe(6);
    expect(s.story!.beat).toBe(0);
    await tapThrough(page);
    await page.waitForFunction(() => window.__GK__?.screen === 'level-select', undefined, { timeout: 5000 });
    expect(await page.evaluate(() => JSON.parse(localStorage.getItem('gk.save.v1')!).story.opening)).toBe(true);
    await page.reload();
    await page.waitForFunction(() => window.__GK__?.screen === 'mode-select', undefined, { timeout: 15000 });
    await page.locator('canvas').click({ position: { x: 5, y: 5 } });
    await page.keyboard.press('Digit1');
    await page.waitForFunction(() => window.__GK__?.screen === 'level-select', undefined, { timeout: 5000 });
  });

  test('字一個一個出現;點一下先把這一幕的字顯示完,再點才到下一幕', async ({ page }) => {
    await openMenu(page);
    await page.keyboard.press('Digit1');
    await page.waitForFunction(() => window.__GK__?.screen === 'story', undefined, { timeout: 5000 });
    await page.waitForTimeout(450);
    let s = await gk(page);
    expect(s.story!.done).toBe(false);
    expect(s.story!.text[0].length).toBeLessThan('在很遠很遠的地方,有一個晚安王國。'.length);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(60);
    s = await gk(page);
    expect(s.story!.beat).toBe(0);
    expect(s.story!.done).toBe(true);
    expect(s.story!.text).toEqual(['在很遠很遠的地方,有一個晚安王國。', '這裡的每個晚上,都很安靜、很溫柔。']);
    await page.keyboard.press('Enter');
    await page.waitForFunction(() => window.__GK__!.story?.beat === 1, undefined, { timeout: 2000 });
  });

  test('右上角「跳過」(或 Esc)直接結束開場', async ({ page }) => {
    await openMenu(page);
    await page.keyboard.press('Digit2');
    await page.waitForFunction(() => window.__GK__?.screen === 'story', undefined, { timeout: 5000 });
    await page.keyboard.press('Escape');
    await page.waitForFunction(() => window.__GK__?.screen === 'level-select', undefined, { timeout: 5000 });
  });

  test('主選單「故事」可以重看開場,看完回到主選單', async ({ page }) => {
    await openMenu(page, { version: 1, weapons: {}, story: { opening: true } });
    await page.keyboard.press('Digit6');
    await page.waitForFunction(() => window.__GK__?.screen === 'story', undefined, { timeout: 5000 });
    await tapThrough(page);
    await page.waitForFunction(() => window.__GK__?.screen === 'mode-select', undefined, { timeout: 5000 });
  });

  test('世界第一關第一次進去:黑底白字一句話;點一下跳過;之後不再出現', async ({ page }) => {
    await page.goto('./?test=1&story=1&mode=single&level=w2-1');
    await page.waitForFunction(() => window.__GK__?.screen === 'range', undefined, { timeout: 15000 });
    expect((await gk(page)).intro).toContain('人面獅身');
    await page.waitForTimeout(1000);
    expect((await gk(page)).intro).toContain('人面獅身');
    await page.locator('canvas').click({ position: { x: 480, y: 270 } });
    await page.waitForFunction(() => window.__GK__!.intro === null, undefined, { timeout: 2000 });
    await page.reload();
    await page.waitForFunction(() => window.__GK__?.screen === 'range', undefined, { timeout: 15000 });
    expect((await gk(page)).intro).toBeNull();
  });

  test('開頭句顯示時按任意鍵也會跳過,跳過之後才開始動', async ({ page }) => {
    await page.goto('./?test=1&story=1&mode=single&level=w3-1');
    await page.waitForFunction(() => window.__GK__?.screen === 'range', undefined, { timeout: 15000 });
    expect((await gk(page)).intro).toContain('水怪');
    await page.keyboard.press('KeyD');
    await page.waitForFunction(() => window.__GK__!.intro === null, undefined, { timeout: 2000 });
    const x0 = (await gk(page)).players![0].x;
    await page.keyboard.down('KeyD');
    await page.waitForTimeout(400);
    await page.keyboard.up('KeyD');
    expect((await gk(page)).players![0].x).toBeGreaterThan(x0);
  });

  test('用跳躍鍵跳過開頭句不會跳起來;按住時遊戲還停著,放開才開始', async ({ page }) => {
    await page.goto('./?test=1&story=1&mode=single&level=w4-1');
    await page.waitForFunction(() => window.__GK__?.screen === 'range', undefined, { timeout: 15000 });
    const y0 = (await gk(page)).players![0].y;
    await page.keyboard.down('KeyV');
    await page.waitForTimeout(300);
    let s = await gk(page);
    expect(s.intro).toBeNull();
    expect(s.introPaused).toBe(true);
    await page.keyboard.up('KeyV');
    await page.waitForFunction(() => window.__GK__!.introPaused === false, undefined, { timeout: 2000 });
    await page.waitForTimeout(300);
    s = await gk(page);
    expect(s.players![0].y).toBe(y0);
  });

  test('世界的開頭句只在第一關;3 秒多後自己消失', async ({ page }) => {
    await page.goto('./?test=1&story=1&mode=single&level=w2-2');
    await page.waitForFunction(() => window.__GK__?.screen === 'range', undefined, { timeout: 15000 });
    expect((await gk(page)).intro).toBeNull();
    await page.goto('./?test=1&story=1&mode=single&level=w5-1');
    await page.waitForFunction(() => window.__GK__?.screen === 'range', undefined, { timeout: 15000 });
    expect((await gk(page)).intro).toContain('黑色的雪');
    await page.waitForFunction(() => window.__GK__!.intro === null, undefined, { timeout: 5000 });
  });

  test('夢貘出場說「不要過來……你們不懂……」,換第二階段說「我……快裝不下了……!」', async ({ page }) => {
    await page.goto('./?test=1&mode=single&level=w10-3');
    await page.waitForFunction(() => window.__GK__?.screen === 'range', undefined, { timeout: 15000 });
    await page.evaluate(() => window.__GK__!.warp!(9700));
    await page.waitForFunction(() => window.__GK__!.bossSay === '不要過來……你們不懂……', undefined, { timeout: 8000 });
    await page.waitForTimeout(2800);
    await page.evaluate(() => window.__GK__!.hurtBoss!(420));
    await page.waitForFunction(() => window.__GK__!.bossSay === '我……快裝不下了……!', undefined, { timeout: 3000 });
  });

  test('打倒夢貘播結局(13 幕),第一次不能整段跳過;點到底進破關結算', async ({ page }) => {
    test.setTimeout(90000);
    await page.goto('./?test=1&story=1&mode=single&level=w10-3');
    await page.waitForFunction(() => window.__GK__?.screen === 'range', undefined, { timeout: 15000 });
    await page.keyboard.press('KeyD');
    await page.evaluate(() => window.__GK__!.warp!(9700));
    await page.waitForFunction(() => window.__GK__!.boss?.type === 'tapir', undefined, { timeout: 8000 });
    await page.evaluate(() => window.__GK__!.hurtBoss!(9999));
    await page.waitForFunction(() => window.__GK__?.screen === 'story', undefined, { timeout: 15000 });
    let s = await gk(page);
    expect(s.story!.id).toBe('ending');
    expect(s.story!.beats).toBe(13);
    expect(s.story!.skippable).toBe(false);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
    s = await gk(page);
    expect(s.screen).toBe('story');
    await tapThrough(page);
    await page.waitForFunction(() => window.__GK__?.screen === 'complete', undefined, { timeout: 5000 });
    expect((await gk(page)).ending).toBe(true);
    expect(await page.evaluate(() => JSON.parse(localStorage.getItem('gk.save.v1')!).story.ending)).toBe(true);
  });

  test('看過結局後:主選單「故事」可以選開場或結局,結局可以跳過', async ({ page }) => {
    await openMenu(page, { version: 1, weapons: {}, story: { opening: true, ending: true } });
    await page.keyboard.press('Digit6');
    await page.waitForFunction(() => window.__GK__?.storyChoice === true, undefined, { timeout: 3000 });
    await page.keyboard.press('KeyE');
    await page.waitForFunction(() => window.__GK__?.screen === 'story', undefined, { timeout: 5000 });
    const s = await gk(page);
    expect(s.story!.id).toBe('ending');
    expect(s.story!.skippable).toBe(true);
    await page.keyboard.press('Escape');
    await page.waitForFunction(() => window.__GK__?.screen === 'mode-select', undefined, { timeout: 5000 });
  });

  test('選關畫面打開測試模式後,還沒看過結局也可以從「故事」看結局', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('gk.test.v1', '1'));
    await openMenu(page, { version: 1, weapons: {}, story: { opening: true } });
    await page.keyboard.press('Digit6');
    await page.waitForFunction(() => window.__GK__?.storyChoice === true, undefined, { timeout: 3000 });
    await page.keyboard.press('KeyE');
    await page.waitForFunction(() => window.__GK__?.story?.id === 'ending', undefined, { timeout: 5000 });
  });

  test('「故事」的選擇按 Esc 可以關掉', async ({ page }) => {
    await openMenu(page, { version: 1, weapons: {}, story: { opening: true, ending: true } });
    await page.keyboard.press('Digit6');
    await page.waitForFunction(() => window.__GK__?.storyChoice === true, undefined, { timeout: 3000 });
    await page.keyboard.press('Escape');
    await page.waitForFunction(() => window.__GK__?.storyChoice === false, undefined, { timeout: 3000 });
    await page.keyboard.press('Digit4');
    await page.waitForFunction(() => window.__GK__?.screen === 'backpack', undefined, { timeout: 3000 });
  });
});
