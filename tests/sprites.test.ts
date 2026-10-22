import { test, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { ANIMS } from '../src/art/animSprites';
import { ART_FACES_RIGHT, SPRITES, SPRITE_KEYS, assetPath, bulletSprite, enemySprite, isLevelAsset, itemSprite, weaponIcon, worldSpriteKeys } from '../src/art/sprites';
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


test('每種魔物都有醒著和睡著的圖,貓頭鷹與人面獅身三個階段各一張', () => {
  for (const t of Object.keys(ENEMY_DEFS) as EnemyType[]) {
    for (const state of ['awake', 'sleep'] as const) {
      const key = enemySprite(t, state);
      expect(key in SPRITES, `${t} ${state}`).toBe(true);
    }
    expect(enemySprite(t, 'sleep')).not.toBe(enemySprite(t, 'awake'));
  }
  for (const boss of ['nightOwl', 'sphinx', 'nessie'] as const) {
    expect(new Set([1, 2, 3].map((p) => enemySprite(boss, 'awake', p as 1 | 2 | 3))).size).toBe(3);
  }
});

test('世界 2 的魔物與機關圖進關卡才載入,世界 1 的開機就載入', () => {
  expect(isLevelAsset('bell-scarab')).toBe(true);
  expect(isLevelAsset('sphinx')).toBe(true);
  expect(isLevelAsset('quicksand')).toBe(true);
  expect(isLevelAsset('w2-s1-far')).toBe(true);
  expect(isLevelAsset('clockbug')).toBe(false);
  expect(isLevelAsset('owl')).toBe(false);
  expect(worldSpriteKeys(2)).toEqual(expect.arrayContaining(['bell-scarab', 'sphinx-3', 'falling-block']));
  expect(worldSpriteKeys(2).some((k) => SPRITES[k].file.startsWith('backgrounds/'))).toBe(false);
  // 動畫格跟著原圖一起在關卡裡載入。
  expect(worldSpriteKeys(2)).toEqual(expect.arrayContaining(['w2-sphinx-boss-phase3-walk-4', 'w2-insomnia-vulture-flap-1']));
  expect(worldSpriteKeys(1)).toEqual(expect.arrayContaining(['squirrel', 'beaver', 'b-acorn', 'b-log']));
  expect(worldSpriteKeys(1)).not.toContain('clockbug');
});

test('道具與武器都有圖', () => {
  const items: ItemId[] = ['hotCocoa', 'shootingStar', 'smallPillow', 'milkBottle'];
  for (const i of items) expect(SPRITES[itemSprite(i)]).toBeDefined();
  const icons = (Object.keys(WEAPONS) as WeaponId[]).map(weaponIcon);
  expect(new Set(icons).size).toBe(icons.length);
});

test('每把武器都有子彈圖', () => {
  for (const id of Object.keys(WEAPONS) as WeaponId[]) expect(SPRITES[bulletSprite(id)]).toBeDefined();
});

test('關主與小頭目都面對玩家:畫成朝右的圖要反過來', () => {
  expect(ART_FACES_RIGHT.has('sphinx')).toBe(true);
  expect(ART_FACES_RIGHT.has('fennec')).toBe(true);
  expect(ART_FACES_RIGHT.has('nessie')).toBe(false);
});

test('動畫格:每一組 4 格,大小和原圖一樣(腳底同一條線)', () => {
  for (const [file, a] of Object.entries(ANIMS)) {
    expect(a.frames, file).toHaveLength(4);
    const base = Object.values(SPRITES).find((x) => x.file === file);
    if (!base) continue;
    for (const f of a.frames) expect(SPRITES[f].h, f).toBe(base.h);
  }
  expect(ANIMS['enemies/w2-sphinx-boss-phase2.png'].kind).toBe('walk');
  expect(ANIMS['enemies/w4-noisy-puffin.png'].kind).toBe('flap');
});

test('網頁載入的都是轉好的 WebP', () => {
  expect(assetPath('bell-scarab')).toBe('web/enemies/w2-bell-scarab.webp');
  expect(assetPath('guard')).toBe('web/characters/default-guard.webp');
});
