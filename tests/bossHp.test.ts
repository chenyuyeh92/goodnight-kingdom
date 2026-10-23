import { test, expect } from 'vitest';
import { BASE_ENEMY_DEFS, BOSS_HP_MULT, ENEMY_DEFS, type EnemyType } from '../src/game/enemies';
import { LEVELS } from '../src/levels';

test('魔王(小頭目與關主)血量是原本的三倍,其他魔物不變', () => {
  expect(BOSS_HP_MULT).toBe(3);
  for (const t of Object.keys(BASE_ENEMY_DEFS) as EnemyType[]) {
    const base = BASE_ENEMY_DEFS[t];
    expect(ENEMY_DEFS[t].hp, t).toBe(base.tier === 'boss' ? base.hp * 3 : base.hp);
  }
});

test('每一關結尾的魔王都是 boss 等級(都會變三倍)', () => {
  for (const [id, L] of Object.entries(LEVELS)) if (L.boss) expect(ENEMY_DEFS[L.boss.type].tier, id).toBe('boss');
});
