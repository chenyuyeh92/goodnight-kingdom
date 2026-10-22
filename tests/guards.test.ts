import { test, expect } from 'vitest';
import { GUARDS_KEY, MAX_GUARDS, createGuardStore, guardFileName, sanitizeGuards } from '../src/draw/guards';
import type { StorageLike } from '../src/config/tuning';

const PNG = 'data:image/png;base64,iVBORw0KGgo=';

function memory(): StorageLike & { data: Map<string, string> } {
  const data = new Map<string, string>();
  return { data, getItem: (k) => data.get(k) ?? null, setItem: (k, v) => void data.set(k, v) };
}

test('新增、讀回、選給 A 和 B', () => {
  const m = memory();
  const s = createGuardStore(m, () => 1000);
  const r = s.add('小明', PNG);
  expect(r.ok).toBe(true);
  const id = r.ok ? r.guard.id : '';
  s.select('A', id);
  s.select('B', id);
  const again = createGuardStore(m).get();
  expect(again.guards.map((g) => g.name)).toEqual(['小明']);
  expect(again.selected).toEqual({ A: id, B: id });
});

test('最多 8 個,第 9 個存不進去', () => {
  const s = createGuardStore(memory());
  for (let i = 0; i < MAX_GUARDS; i++) expect(s.add(`g${i}`, PNG).ok).toBe(true);
  expect(s.add('多的', PNG)).toEqual({ ok: false, reason: 'full' });
});

test('刪除時也取消選用', () => {
  const s = createGuardStore(memory());
  const r = s.add('a', PNG);
  const id = r.ok ? r.guard.id : '';
  s.select('A', id);
  s.remove(id);
  expect(s.get().guards).toEqual([]);
  expect(s.get().selected.A).toBeNull();
});

test('名字去掉空白、限制長度,沒填就叫守衛', () => {
  const s = createGuardStore(memory());
  const a = s.add('   ', PNG);
  const b = s.add('一二三四五六七八九十十一', PNG);
  expect(a.ok && a.guard.name).toBe('守衛');
  expect(b.ok && b.guard.name.length).toBe(8);
});

test('壞資料:不是 PNG、太大、選到不存在的守衛都丟掉', () => {
  const g = sanitizeGuards({
    version: 1,
    guards: [
      { id: 'a', name: 'ok', png: PNG, createdAt: 1 },
      { id: 'b', name: 'bad', png: 'javascript:alert(1)', createdAt: 1 },
      { id: 'c', name: 'big', png: `${PNG}${'A'.repeat(500000)}`, createdAt: 1 },
      'junk',
    ],
    selected: { A: 'b', B: 'a' },
  });
  expect(g.guards.map((x) => x.id)).toEqual(['a']);
  expect(g.selected).toEqual({ A: null, B: 'a' });
});

test('存檔內容壞掉或寫不進去也能用', () => {
  const m = memory();
  m.setItem(GUARDS_KEY, '{bad');
  expect(createGuardStore(m).get().guards).toEqual([]);
  const full: StorageLike = { getItem: () => null, setItem: () => { throw new Error('QuotaExceededError'); } };
  expect(createGuardStore(full).add('a', PNG)).toEqual({ ok: false, reason: 'storage' });
});

test('下載檔名:晚安王國-名字.png,去掉不能用的字元', () => {
  expect(guardFileName('小勇')).toBe('晚安王國-小勇.png');
  expect(guardFileName('a/b:c*?')).toBe('晚安王國-abc.png');
  expect(guardFileName('  ')).toBe('晚安王國-守衛.png');
});

test('沒有存檔空間時不新增,也不會在記憶體裡多出重複的守衛', () => {
  const s = createGuardStore(null);
  expect(s.add('a', PNG)).toEqual({ ok: false, reason: 'storage' });
  expect(s.add('a', PNG)).toEqual({ ok: false, reason: 'storage' });
  expect(s.get().guards).toHaveLength(0);
});

test('名字用字元算長度,emoji 不會被切一半', () => {
  const s = createGuardStore(memory());
  const r = s.add('🐑🐑🐑🐑🐑🐑🐑🐑🐑', PNG);
  expect(r.ok && Array.from(r.guard.name)).toHaveLength(8);
  expect(r.ok && r.guard.name).toBe('🐑'.repeat(8));
});

test('清除所有守衛', () => {
  const s = createGuardStore(memory());
  const r = s.add('a', PNG);
  s.select('A', r.ok ? r.guard.id : null);
  s.clear();
  expect(s.get()).toEqual({ version: 1, guards: [], selected: { A: null, B: null } });
});
