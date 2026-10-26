import { test, expect, type Page } from '@playwright/test';
import fs from 'node:fs';

// 匯出/匯入存檔(2026-10-26):設定畫面的兩個按鈕。換電腦時帶走通關紀錄、背包、畫的守衛;購買紀錄不跟著走。

const SAVE = JSON.stringify({ version: 1, weapons: {}, cleared: { 'w1-1': 12345, 'w1-2': 23456 }, story: { opening: true } });

const toSettings = async (page: Page): Promise<void> => {
  await page.waitForFunction(() => window.__GK__?.screen === 'mode-select', undefined, { timeout: 15000 });
  await page.locator('canvas').click({ position: { x: 5, y: 5 } });
  await page.keyboard.press('Digit5');
  await page.waitForFunction(() => window.__GK__?.screen === 'settings');
};
/** 鍵盤移到某一列(從音樂那列往下數)。 */
const goRow = async (page: Page, row: string): Promise<void> => {
  for (let i = 0; i < 10 && (await page.evaluate(() => window.__GK__!.settingsRow)) !== row; i++) await page.keyboard.press('ArrowDown');
  expect(await page.evaluate(() => window.__GK__!.settingsRow)).toBe(row);
};

test('匯出存檔:下載一個檔案,裡面有通關紀錄,沒有購買紀錄', async ({ page }) => {
  await page.addInitScript((s) => {
    localStorage.setItem('gk.save.v1', s);
    localStorage.setItem('gk.webfull.v1', '{"code":"ABCDEFGHJKLM"}');
  }, SAVE);
  await page.goto('./');
  await toSettings(page);
  await goRow(page, 'export');
  const [dl] = await Promise.all([page.waitForEvent('download'), page.keyboard.press('Enter')]);
  expect(dl.suggestedFilename()).toMatch(/^晚安王國存檔-\d{4}-\d{2}-\d{2}\.json$/);
  const b = JSON.parse(fs.readFileSync(await dl.path(), 'utf8'));
  expect(b.app).toBe('goodnight-kingdom');
  expect(JSON.parse(b.data['gk.save.v1']).cleared).toEqual({ 'w1-1': 12345, 'w1-2': 23456 });
  expect(b.data['gk.webfull.v1']).toBeUndefined();
});

test('匯入存檔:選檔、確定 → 進度換成檔案裡的,遊戲重新打開', async ({ page }) => {
  await page.addInitScript(() => {
    if (!sessionStorage.getItem('seeded')) {
      sessionStorage.setItem('seeded', '1');
      localStorage.setItem('gk.save.v1', JSON.stringify({ version: 1, weapons: {}, cleared: {}, story: { opening: true } }));
    }
  });
  await page.goto('./');
  await toSettings(page);
  await goRow(page, 'export');
  await page.keyboard.press('ArrowRight');
  expect(await page.evaluate(() => window.__GK__!.settingsRow)).toBe('import');
  page.once('dialog', (d) => void d.accept());
  const [chooser] = await Promise.all([page.waitForEvent('filechooser'), page.keyboard.press('Enter')]);
  await chooser.setFiles({ name: '晚安王國存檔-2026-10-26.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify({ app: 'goodnight-kingdom', version: 1, at: '', data: { 'gk.save.v1': SAVE } })) });
  await page.waitForFunction(() => window.__GK__?.screen === 'mode-select', undefined, { timeout: 15000 });
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('gk.save.v1')!).cleared['w1-2'])).toBe(23456);
});

test('匯入不是存檔的檔案:說明「這不是晚安王國的存檔」,進度不動', async ({ page }) => {
  await page.addInitScript((s) => localStorage.setItem('gk.save.v1', s), SAVE);
  await page.goto('./');
  await toSettings(page);
  await goRow(page, 'import');
  const [chooser] = await Promise.all([page.waitForEvent('filechooser'), page.keyboard.press('Enter')]);
  await chooser.setFiles({ name: 'photo.json', mimeType: 'application/json', buffer: Buffer.from('{"hello":1}') });
  await page.waitForTimeout(500);
  expect(await page.evaluate(() => window.__GK__!.screen)).toBe('settings');
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('gk.save.v1')!).cleared)).toEqual({ 'w1-1': 12345, 'w1-2': 23456 });
});

test('App 裡沒有匯出/匯入(WebView 不能下載檔案)', async ({ page }) => {
  await page.addInitScript(() => {
    (window as unknown as { ReactNativeWebView: { postMessage(d: string): void } }).ReactNativeWebView = { postMessage: () => {} };
  });
  await page.goto('./');
  await toSettings(page);
  for (let i = 0; i < 10; i++) {
    await page.keyboard.press('ArrowDown');
    expect(['export', 'import']).not.toContain(await page.evaluate(() => window.__GK__!.settingsRow));
  }
});
