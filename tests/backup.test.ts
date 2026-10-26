import { expect, test } from 'vitest';
import { backupFileName, makeBackup, parseBackup, restoreBackup, type BackupStorage } from '../src/game/backup';

// 匯出/匯入存檔(換電腦時帶走進度):遊戲資料整份搬過去,購買紀錄不能跟著搬。

function memory(init: Record<string, string> = {}): BackupStorage & { data: Record<string, string> } {
  const data: Record<string, string> = { ...init };
  return {
    data,
    get length() {
      return Object.keys(data).length;
    },
    key: (i) => Object.keys(data)[i] ?? null,
    getItem: (k) => data[k] ?? null,
    setItem: (k, v) => void (data[k] = v),
    removeItem: (k) => void delete data[k],
  };
}

const OLD_PC = { 'gk.save.v1': '{"cleared":{"w1-1":1}}', 'gk.guards.v1': '[guard]', 'gk.lang.v1': 'en', 'gk.full.v1': '1', 'gk.webfull.v1': '{"code":"X"}', 'other.site': 'x' };

test('匯出:遊戲的資料都有,購買紀錄和別的網站的資料沒有', () => {
  const b = makeBackup(memory(OLD_PC), new Date('2026-10-26T12:00:00Z'));
  expect(b.app).toBe('goodnight-kingdom');
  expect(Object.keys(b.data)).toEqual(['gk.guards.v1', 'gk.lang.v1', 'gk.save.v1']);
  expect(b.at).toBe('2026-10-26T12:00:00.000Z');
});

test('匯入到新電腦:進度換成備份的,原本的購買紀錄不動', () => {
  const text = JSON.stringify(makeBackup(memory(OLD_PC)));
  const pc = memory({ 'gk.save.v1': '{"cleared":{}}', 'gk.settings.v1': 'old', 'gk.full.v1': '1' });
  const b = parseBackup(text);
  expect(b).not.toBeNull();
  restoreBackup(pc, b!);
  expect(pc.data['gk.save.v1']).toBe(OLD_PC['gk.save.v1']);
  expect(pc.data['gk.guards.v1']).toBe('[guard]');
  expect(pc.data['gk.settings.v1']).toBeUndefined(); // 整份換掉,新電腦原本的設定也一起換
  expect(pc.data['gk.full.v1']).toBe('1');
  expect(pc.data['gk.webfull.v1']).toBeUndefined();
});

test('別人改過的備份檔:塞進購買紀錄也不會被匯入', () => {
  const text = JSON.stringify({ app: 'goodnight-kingdom', version: 1, at: '', data: { 'gk.save.v1': '{}', 'gk.webfull.v1': '{"code":"FREE"}', 'gk.full.v1': '1' } });
  const pc = memory();
  restoreBackup(pc, parseBackup(text)!);
  expect(pc.data).toEqual({ 'gk.save.v1': '{}' });
});

test('不是晚安王國的檔案:不碰任何資料', () => {
  expect(parseBackup('not json')).toBeNull();
  expect(parseBackup('{"app":"other","version":1,"data":{}}')).toBeNull();
  expect(parseBackup('{"app":"goodnight-kingdom","version":99,"data":{}}')).toBeNull();
  expect(parseBackup('{"app":"goodnight-kingdom","version":1,"data":{"gk.save.v1":5}}')).toBeNull();
  expect(parseBackup('{"app":"goodnight-kingdom","version":1,"data":[]}')).toBeNull();
});

test('檔名有日期', () => {
  expect(backupFileName(new Date(2026, 9, 6))).toBe('晚安王國存檔-2026-10-06.json');
});
