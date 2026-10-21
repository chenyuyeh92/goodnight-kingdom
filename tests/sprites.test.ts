import { test, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { SPRITES, SPRITE_KEYS, enemySprite, itemSprite, weaponIcon } from '../src/art/sprites';
import { ENEMY_DEFS, type EnemyType } from '../src/game/enemies';
import { WEAPONS, type WeaponId } from '../src/game/weapons';
import type { ItemId } from '../src/game/items';

function pngSize(path: string): { w: number; h: number } {
  const b = readFileSync(path);
  return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
}

test('每張素材都在 public/assets 且大小和對照表一致', () => {
  for (const k of SPRITE_KEYS) {
    const path = `public/assets/${SPRITES[k].file}`;
    expect(existsSync(path), path).toBe(true);
    expect(pngSize(path), path).toEqual({ w: SPRITES[k].w, h: SPRITES[k].h });
  }
});

test('每種魔物都有醒著和睡著的圖,貓頭鷹三個階段各一張', () => {
  for (const t of Object.keys(ENEMY_DEFS) as EnemyType[]) {
    expect(SPRITES[enemySprite(t, 'awake')]).toBeDefined();
    expect(SPRITES[enemySprite(t, 'sleep')]).toBeDefined();
    expect(enemySprite(t, 'sleep')).not.toBe(enemySprite(t, 'awake'));
  }
  expect(new Set([1, 2, 3].map((p) => enemySprite('nightOwl', 'awake', p as 1 | 2 | 3))).size).toBe(3);
});

test('道具與武器都有圖', () => {
  const items: ItemId[] = ['hotCocoa', 'shootingStar', 'smallPillow', 'milkBottle'];
  for (const i of items) expect(SPRITES[itemSprite(i)]).toBeDefined();
  const icons = (Object.keys(WEAPONS) as WeaponId[]).map(weaponIcon);
  expect(new Set(icons).size).toBe(icons.length);
});
