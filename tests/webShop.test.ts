import { afterEach, expect, test } from 'vitest';
import { WEB_FULL_KEY, normalizeCode, redeemCode, resetWebShop, webShopAllowed, webState } from '../src/platform/webShop';
import { fullVersion, needsFullVersion } from '../src/config/edition';

// 網頁版的完整版(綠界):解鎖碼問小商店,對了才打開;App 裡一律不算(Apple 3.1.1)。

const memory = (): { getItem(k: string): string | null; setItem(k: string, v: string): void; data: Record<string, string> } => {
  const data: Record<string, string> = {};
  return { data, getItem: (k) => data[k] ?? null, setItem: (k, v) => void (data[k] = v) };
};
const reply = (body: unknown): typeof fetch => (async () => new Response(JSON.stringify(body))) as unknown as typeof fetch;

afterEach(() => {
  resetWebShop();
  delete (globalThis as { window?: unknown }).window;
});

test('解鎖碼不管大小寫、空白、橫線', () => {
  expect(normalizeCode(' abcd-efgh jklm ')).toBe('ABCDEFGHJKLM');
});

test('字數不對:不問小商店', async () => {
  let asked = false;
  const f = (async () => {
    asked = true;
    return new Response('{}');
  }) as unknown as typeof fetch;
  expect(await redeemCode('ABC', f)).toBe('format');
  expect(asked).toBe(false);
});

test('正式環境買的碼:完整版打開', async () => {
  expect(await redeemCode('ABCD-EFGH-JKLM', reply({ ok: true, stage: false }))).toBe('ok');
  expect(webState.full).toBe(true);
  expect(webState.test).toBe(false);
  expect(fullVersion()).toBe(true);
  expect(needsFullVersion('w4-1')).toBe(false);
});

test('測試環境買的碼:這次打開有效,但標記成測試', async () => {
  expect(await redeemCode('ABCD-EFGH-JKLM', reply({ ok: true, stage: true }))).toBe('test');
  expect(webState.full).toBe(true);
  expect(webState.test).toBe(true);
});

test('找不到、超過裝置數、連不上:都不打開', async () => {
  expect(await redeemCode('ABCD-EFGH-JKLM', reply({ ok: false, error: 'notfound' }))).toBe('notfound');
  expect(await redeemCode('ABCD-EFGH-JKLM', reply({ ok: false, error: 'limit' }))).toBe('limit');
  const down = (async () => {
    throw new TypeError('fetch failed');
  }) as unknown as typeof fetch;
  expect(await redeemCode('ABCD-EFGH-JKLM', down)).toBe('network');
  expect(webState.full).toBe(false);
  expect(needsFullVersion('w4-1')).toBe(true);
});

test('App 裡(有 ReactNativeWebView):網頁版的購買不存在,解鎖碼也不算', async () => {
  (globalThis as { window?: unknown }).window = { ReactNativeWebView: { postMessage: () => {} } };
  expect(webShopAllowed()).toBe(false);
  expect(await redeemCode('ABCD-EFGH-JKLM', reply({ ok: true, stage: false }))).toBe('notfound');
  webState.full = true; // 就算網頁版的狀態被設成已解鎖,App 裡也不算
  expect(fullVersion()).toBe(false);
});

test('記住解鎖的 key 跟 App 版不同', () => {
  expect(WEB_FULL_KEY).not.toBe('gk.full.v1');
  expect(memory().getItem(WEB_FULL_KEY)).toBeNull();
});
