import type { EnemyType } from '../game/enemies';
import type { ItemId } from '../game/items';
import type { WeaponId } from '../game/weapons';

/** 美術素材:檔名(相對 public/assets)與原始大小。素材已是遊戲內 1 倍大小。 */
export const SPRITES = {
  'bg-far': { file: 'backgrounds/forest-far.png', w: 1440, h: 540 },
  'bg-mid': { file: 'backgrounds/forest-mid.png', w: 1609, h: 540 },
  'bg-near': { file: 'backgrounds/forest-near.png', w: 1396, h: 540 },
  'w1-s1-far': { file: 'backgrounds/w1-s1-far.png', w: 1440, h: 540 },
  'w1-s1-mid': { file: 'backgrounds/w1-s1-mid.png', w: 1440, h: 540 },
  'w1-s1-near': { file: 'backgrounds/w1-s1-near.png', w: 542, h: 540 },
  'w1-s2-far': { file: 'backgrounds/w1-s2-far.png', w: 1440, h: 540 },
  'w1-s2-mid': { file: 'backgrounds/w1-s2-mid.png', w: 1440, h: 540 },
  'w1-s2-near': { file: 'backgrounds/w1-s2-near.png', w: 1046, h: 540 },
  'w1-s4-far': { file: 'backgrounds/w1-s4-far.png', w: 1440, h: 540 },
  'w1-s4-mid': { file: 'backgrounds/w1-s4-mid.png', w: 1516, h: 540 },
  'w1-s4-near': { file: 'backgrounds/w1-s4-near.png', w: 183, h: 540 },
  'w2-s1-far': { file: 'backgrounds/w2-s1-far.png', w: 1440, h: 540 },
  'w2-s1-mid': { file: 'backgrounds/w2-s1-mid.png', w: 1376, h: 540 },
  'w2-s1-near': { file: 'backgrounds/w2-s1-near.png', w: 1103, h: 540 },
  'w2-s2-far': { file: 'backgrounds/w2-s2-far.png', w: 1440, h: 540 },
  'w2-s2-mid': { file: 'backgrounds/w2-s2-mid.png', w: 1606, h: 540 },
  'w2-s2-near': { file: 'backgrounds/w2-s2-near.png', w: 1440, h: 540 },
  'w2-s3-far': { file: 'backgrounds/w2-desert-far.png', w: 1440, h: 540 },
  'w2-s3-mid': { file: 'backgrounds/w2-desert-mid.png', w: 1393, h: 540 },
  'w2-s3-near': { file: 'backgrounds/w2-desert-near.png', w: 1440, h: 540 },
  'w2-s4-far': { file: 'backgrounds/w2-s4-far.png', w: 1440, h: 540 },
  'w2-s4-mid': { file: 'backgrounds/w2-s4-mid.png', w: 1376, h: 540 },
  'w2-s4-near': { file: 'backgrounds/w2-s4-near.png', w: 1440, h: 540 },
  guard: { file: 'characters/default-guard.png', w: 48, h: 55 },
  'pajama-outline': { file: 'characters/pajama-outline.png', w: 289, h: 512 },
  clockbug: { file: 'enemies/clockbug.png', w: 48, h: 56 },
  'clockbug-sleep': { file: 'enemies/clockbug-sleep.png', w: 47, h: 56 },
  'coffee-bean': { file: 'enemies/coffee-bean-sprite.png', w: 39, h: 52 },
  'coffee-bean-sleep': { file: 'enemies/coffee-bean-sprite-sleep.png', w: 38, h: 52 },
  'night-bat': { file: 'enemies/night-bat.png', w: 56, h: 56 },
  'night-bat-sleep': { file: 'enemies/night-bat-sleep.png', w: 54, h: 56 },
  hedgehog: { file: 'enemies/insomnia-hedgehog.png', w: 57, h: 72 },
  'hedgehog-sleep': { file: 'enemies/insomnia-hedgehog-sleep.png', w: 61, h: 72 },
  'hedgehog-roll': { file: 'enemies/insomnia-hedgehog-roll.png', w: 48, h: 48 },
  owl: { file: 'enemies/night-owl-boss.png', w: 181, h: 200 },
  'owl-2': { file: 'enemies/night-owl-boss-phase2.png', w: 183, h: 200 },
  'owl-3': { file: 'enemies/night-owl-boss-phase3.png', w: 176, h: 200 },
  'owl-sleep': { file: 'enemies/night-owl-boss-sleep.png', w: 184, h: 200 },
  'bell-scarab': { file: 'enemies/w2-bell-scarab.png', w: 43, h: 52 },
  'bell-scarab-sleep': { file: 'enemies/w2-bell-scarab-sleep.png', w: 42, h: 52 },
  'mummy-cat': { file: 'enemies/w2-mummy-cat.png', w: 56, h: 52 },
  'mummy-cat-sleep': { file: 'enemies/w2-mummy-cat-sleep.png', w: 56, h: 53 },
  'sand-snake': { file: 'enemies/w2-coffee-sand-snake.png', w: 52, h: 53 },
  'sand-snake-sleep': { file: 'enemies/w2-coffee-sand-snake-sleep.png', w: 52, h: 53 },
  vulture: { file: 'enemies/w2-insomnia-vulture.png', w: 60, h: 56 },
  'vulture-sleep': { file: 'enemies/w2-insomnia-vulture-sleep.png', w: 59, h: 56 },
  tortoise: { file: 'enemies/w2-desert-tortoise.png', w: 55, h: 64 },
  'tortoise-sleep': { file: 'enemies/w2-desert-tortoise-sleep.png', w: 56, h: 64 },
  sphinx: { file: 'enemies/w2-sphinx-boss.png', w: 205, h: 200 },
  'sphinx-2': { file: 'enemies/w2-sphinx-boss-phase2.png', w: 220, h: 200 },
  'sphinx-3': { file: 'enemies/w2-sphinx-boss-phase3.png', w: 213, h: 200 },
  'sphinx-sleep': { file: 'enemies/w2-sphinx-boss-sleep.png', w: 206, h: 200 },
  quicksand: { file: 'items/w2-quicksand.png', w: 96, h: 24 },
  'pressure-plate': { file: 'items/w2-pressure-plate.png', w: 40, h: 12 },
  'falling-block': { file: 'items/w2-falling-block.png', w: 40, h: 39 },
  zzz: { file: 'fx/zzz.png', w: 32, h: 31 },
  'dream-sheep': { file: 'fx/dream-sheep.png', w: 40, h: 36 },
  'hot-cocoa': { file: 'items/hot-cocoa.png', w: 23, h: 32 },
  'shooting-star': { file: 'items/shooting-star.png', w: 32, h: 30 },
  'small-pillow': { file: 'items/small-pillow.png', w: 32, h: 24 },
  'milk-bottle': { file: 'items/milk-bottle.png', w: 15, h: 32 },
  chest: { file: 'items/treasure-chest.png', w: 40, h: 38 },
  'chest-closed': { file: 'items/treasure-chest-closed.png', w: 40, h: 37 },
  target: { file: 'items/practice-target.png', w: 40, h: 40 },
  'w-yawn-bubble': { file: 'weapons/yawn-bubble.png', w: 43, h: 36 },
  'w-sheep-gun': { file: 'weapons/sheep-machine-gun.png', w: 48, h: 21 },
  'w-pillow-cannon': { file: 'weapons/pillow-cannon.png', w: 43, h: 36 },
  'w-milk-spray': { file: 'weapons/milk-spray.png', w: 41, h: 36 },
  'w-lullaby-harp': { file: 'weapons/lullaby-harp.png', w: 40, h: 38 },
  'w-blanket-boomerang': { file: 'weapons/blanket-boomerang.png', w: 40, h: 37 },
  'w-moon-lamp': { file: 'weapons/moon-lamp.png', w: 27, h: 40 },
  'ui-cover-bg': { file: 'ui/cover-bg.png', w: 1920, h: 1080 },
  'ui-logo': { file: 'ui/logo.png', w: 1243, h: 518 },
  'ui-guard': { file: 'ui/cover-guard.png', w: 350, h: 400 },
  'ui-panel': { file: 'ui/panel.png', w: 96, h: 96 },
  btn: { file: 'ui/button-normal.png', w: 240, h: 64 },
  'btn-hover': { file: 'ui/button-hover.png', w: 240, h: 64 },
  'btn-pressed': { file: 'ui/button-pressed.png', w: 240, h: 64 },
  'btn-start': { file: 'ui/button-start.png', w: 240, h: 64 },
  'btn-start-hover': { file: 'ui/button-start-hover.png', w: 240, h: 64 },
  'btn-start-pressed': { file: 'ui/button-start-pressed.png', w: 240, h: 64 },
  'btn-duo': { file: 'ui/button-duo.png', w: 240, h: 64 },
  'btn-duo-hover': { file: 'ui/button-duo-hover.png', w: 240, h: 64 },
  'btn-duo-pressed': { file: 'ui/button-duo-pressed.png', w: 240, h: 64 },
  'btn-draw': { file: 'ui/button-draw.png', w: 240, h: 64 },
  'btn-draw-hover': { file: 'ui/button-draw-hover.png', w: 240, h: 64 },
  'btn-draw-pressed': { file: 'ui/button-draw-pressed.png', w: 240, h: 64 },
  'btn-settings': { file: 'ui/button-settings.png', w: 240, h: 64 },
  'btn-settings-hover': { file: 'ui/button-settings-hover.png', w: 240, h: 64 },
  'btn-settings-pressed': { file: 'ui/button-settings-pressed.png', w: 240, h: 64 },
  'btn-backpack': { file: 'ui/button-backpack.png', w: 240, h: 64 },
  'btn-backpack-hover': { file: 'ui/button-backpack-hover.png', w: 240, h: 64 },
  'btn-backpack-pressed': { file: 'ui/button-backpack-pressed.png', w: 240, h: 64 },
  'b-yawn': { file: 'bullets/yawn-bubble.png', w: 12, h: 12 },
  'b-sheep': { file: 'bullets/sheep.png', w: 20, h: 16 },
  'b-pillow': { file: 'bullets/pillow.png', w: 32, h: 19 },
  'b-milk': { file: 'bullets/milk-drop.png', w: 10, h: 10 },
  'b-note': { file: 'bullets/music-note.png', w: 11, h: 14 },
  'b-moon': { file: 'bullets/moon-beam.png', w: 32, h: 10 },
} as const satisfies Record<string, { file: string; w: number; h: number }>;

export type SpriteKey = keyof typeof SPRITES;

export const SPRITE_KEYS = Object.keys(SPRITES) as SpriteKey[];

/**
 * 進關卡時才載入的圖:背景,以及世界 2 起的魔物與機關(檔名 w2-、w3-…開頭)。
 * 開機只載入主頁與世界 1 用得到的小圖。
 */
export function isLevelAsset(key: SpriteKey): boolean {
  const file = SPRITES[key].file;
  return file.startsWith('backgrounds/') || /\/w\d+-/.test(file);
}

/** 某個世界專屬的魔物與機關圖(不含背景)。 */
export function worldSpriteKeys(world: number): SpriteKey[] {
  return SPRITE_KEYS.filter((k) => !SPRITES[k].file.startsWith('backgrounds/') && SPRITES[k].file.includes(`/w${world}-`));
}

/** 這些大圖用 tools/build_web_assets.py 轉成 WebP 載入。 */
const WEBP = /^(backgrounds\/|ui\/cover-bg\.png$)/;

/** 網頁實際載入的路徑(相對網站根目錄):背景用 tools/build_web_assets.py 轉好的 WebP,其他用美術原檔。 */
export function assetPath(key: SpriteKey): string {
  const file = SPRITES[key].file;
  if (WEBP.test(file)) return `web/${file.replace(/\.png$/, '.webp')}`;
  return `assets/${file}`;
}

/** 貓頭鷹原圖 200 高,畫成 0.75 倍。 */
export const OWL_ART_SCALE = 0.75;

/** 人面獅身原圖 200 高,畫成 0.75 倍。 */
export const SPHINX_ART_SCALE = 0.75;

/** 畫的時候要縮放的魔物(關主縮小;世界 1 的小頭目暫時用原本魔物的圖放大)。 */
export const ENEMY_ART_SCALE: Partial<Record<EnemyType, number>> = {
  nightOwl: OWL_ART_SCALE,
  sphinx: SPHINX_ART_SCALE,
  bigClockBug: 1.5,
  hedgehogCaptain: 1.4,
};

/** 小頭目染色,和一般魔物區分。 */
export const ENEMY_ART_TINT: Partial<Record<EnemyType, number>> = { bigClockBug: 0xffc890, hedgehogCaptain: 0xffa8a8 };

/**
 * 美術還沒畫的小頭目(駱駝、耳廓狐)先用程式畫的造型(src/art/placeholders.ts);
 * 美術畫好後加進 SPRITES,把這裡的對照換成正式的圖。
 */
export type PlaceholderKey = 'gk-camel' | 'gk-camel-sleep' | 'gk-fennec' | 'gk-fennec-sleep';
export type ArtKey = SpriteKey | PlaceholderKey;

type PhasedBoss = 'nightOwl' | 'sphinx';

const ENEMY_AWAKE: Record<Exclude<EnemyType, PhasedBoss>, ArtKey> = {
  alarmBug: 'clockbug',
  coffeeBean: 'coffee-bean',
  nightBat: 'night-bat',
  hedgehog: 'hedgehog',
  bigClockBug: 'clockbug',
  hedgehogCaptain: 'hedgehog',
  bellScarab: 'bell-scarab',
  mummyCat: 'mummy-cat',
  sandSnake: 'sand-snake',
  vulture: 'vulture',
  tortoise: 'tortoise',
  camel: 'gk-camel',
  fennec: 'gk-fennec',
};
const ENEMY_SLEEP: Record<Exclude<EnemyType, PhasedBoss>, ArtKey> = {
  alarmBug: 'clockbug-sleep',
  coffeeBean: 'coffee-bean-sleep',
  nightBat: 'night-bat-sleep',
  hedgehog: 'hedgehog-sleep',
  bigClockBug: 'clockbug-sleep',
  hedgehogCaptain: 'hedgehog-sleep',
  bellScarab: 'bell-scarab-sleep',
  mummyCat: 'mummy-cat-sleep',
  sandSnake: 'sand-snake-sleep',
  vulture: 'vulture-sleep',
  tortoise: 'tortoise-sleep',
  camel: 'gk-camel-sleep',
  fennec: 'gk-fennec-sleep',
};
const BOSS_PHASES: Record<PhasedBoss, { 1: SpriteKey; 2: SpriteKey; 3: SpriteKey; sleep: SpriteKey }> = {
  nightOwl: { 1: 'owl', 2: 'owl-2', 3: 'owl-3', sleep: 'owl-sleep' },
  sphinx: { 1: 'sphinx', 2: 'sphinx-2', 3: 'sphinx-3', sleep: 'sphinx-sleep' },
};

export function enemySprite(type: EnemyType, state: 'awake' | 'sleep', phase: 1 | 2 | 3 = 1): ArtKey {
  if (type === 'nightOwl' || type === 'sphinx') return state === 'sleep' ? BOSS_PHASES[type].sleep : BOSS_PHASES[type][phase];
  return state === 'sleep' ? ENEMY_SLEEP[type] : ENEMY_AWAKE[type];
}

const ITEMS: Record<ItemId, SpriteKey> = {
  hotCocoa: 'hot-cocoa',
  shootingStar: 'shooting-star',
  smallPillow: 'small-pillow',
  milkBottle: 'milk-bottle',
};

export function itemSprite(id: ItemId): SpriteKey {
  return ITEMS[id];
}

const WEAPON_ICONS: Record<WeaponId, SpriteKey> = {
  yawnBubble: 'w-yawn-bubble',
  sheepGun: 'w-sheep-gun',
  pillowCannon: 'w-pillow-cannon',
  milkSpray: 'w-milk-spray',
  lullabyHarp: 'w-lullaby-harp',
  blanketBoomerang: 'w-blanket-boomerang',
  moonLamp: 'w-moon-lamp',
};

export function weaponIcon(id: WeaponId): SpriteKey {
  return WEAPON_ICONS[id];
}

/** 子彈圖;棉被迴力鏢直接用武器圖旋轉著飛。 */
const BULLETS: Record<WeaponId, SpriteKey> = {
  yawnBubble: 'b-yawn',
  sheepGun: 'b-sheep',
  pillowCannon: 'b-pillow',
  milkSpray: 'b-milk',
  lullabyHarp: 'b-note',
  blanketBoomerang: 'w-blanket-boomerang',
  moonLamp: 'b-moon',
};

export function bulletSprite(id: WeaponId): SpriteKey {
  return BULLETS[id];
}

/** 圖片載入狀態:BootScene 寫入,場景與測試讀取。 */
export const artStatus: { loaded: number; missing: string[]; disabled: boolean } = { loaded: 0, missing: [], disabled: false };
