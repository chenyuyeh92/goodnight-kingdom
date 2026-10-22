import type { EnemyType } from '../game/enemies';
import type { ItemId } from '../game/items';
import type { WeaponId } from '../game/weapons';
import { ANIM_SPRITES } from './animSprites';

/** 美術素材:檔名(相對 public/assets)與原始大小。素材已是遊戲內 1 倍大小。 */
const BASE_SPRITES = {
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
  'w3-s1-far': { file: 'backgrounds/w3-s1-far.png', w: 1440, h: 540 },
  'w3-s1-mid': { file: 'backgrounds/w3-s1-mid.png', w: 1551, h: 540 },
  'w3-s1-near': { file: 'backgrounds/w3-s1-near.png', w: 1440, h: 540 },
  'w3-s2-far': { file: 'backgrounds/w3-s2-far.png', w: 1440, h: 540 },
  'w3-s2-mid': { file: 'backgrounds/w3-s2-mid.png', w: 1554, h: 540 },
  'w3-s2-near': { file: 'backgrounds/w3-s2-near.png', w: 1440, h: 540 },
  'w3-s3-far': { file: 'backgrounds/w3-s3-far.png', w: 1440, h: 540 },
  'w3-s3-mid': { file: 'backgrounds/w3-s3-mid.png', w: 1540, h: 540 },
  'w3-s3-near': { file: 'backgrounds/w3-s3-near.png', w: 1440, h: 540 },
  'w3-s4-far': { file: 'backgrounds/w3-s4-far.png', w: 1440, h: 540 },
  'w3-s4-mid': { file: 'backgrounds/w3-s4-mid.png', w: 1418, h: 540 },
  'w3-s4-near': { file: 'backgrounds/w3-s4-near.png', w: 1440, h: 540 },
  'w4-s1-far': { file: 'backgrounds/w4-s1-far.png', w: 1440, h: 540 },
  'w4-s1-mid': { file: 'backgrounds/w4-s1-mid.png', w: 1440, h: 540 },
  'w4-s1-near': { file: 'backgrounds/w4-s1-near.png', w: 1440, h: 540 },
  'w4-s2-far': { file: 'backgrounds/w4-s2-far.png', w: 1440, h: 540 },
  'w4-s2-mid': { file: 'backgrounds/w4-s2-mid.png', w: 1440, h: 540 },
  'w4-s2-near': { file: 'backgrounds/w4-s2-near.png', w: 1440, h: 540 },
  'w4-s3-far': { file: 'backgrounds/w4-s3-far.png', w: 1440, h: 540 },
  'w4-s3-mid': { file: 'backgrounds/w4-s3-mid.png', w: 1440, h: 540 },
  'w4-s3-near': { file: 'backgrounds/w4-s3-near.png', w: 1440, h: 540 },
  'w4-s4-far': { file: 'backgrounds/w4-s4-far.png', w: 1440, h: 540 },
  'w4-s4-mid': { file: 'backgrounds/w4-s4-mid.png', w: 1440, h: 540 },
  'w4-s4-near': { file: 'backgrounds/w4-s4-near.png', w: 1440, h: 540 },
  guard: { file: 'characters/default-guard.png', w: 48, h: 55 },
  'guard-walk-1': { file: 'characters/default-guard-walk-1.png', w: 48, h: 55 },
  'guard-walk-2': { file: 'characters/default-guard-walk-2.png', w: 48, h: 55 },
  'guard-walk-3': { file: 'characters/default-guard-walk-3.png', w: 48, h: 55 },
  'guard-walk-4': { file: 'characters/default-guard-walk-4.png', w: 48, h: 55 },
  'guard-jump': { file: 'characters/default-guard-jump.png', w: 48, h: 55 },
  'pajama-outline': { file: 'characters/pajama-outline.png', w: 289, h: 512 },
  clockbug: { file: 'enemies/clockbug.png', w: 48, h: 56 },
  'clockbug-sleep': { file: 'enemies/clockbug-sleep.png', w: 47, h: 56 },
  'clockbug-walk-1': { file: 'enemies/clockbug-walk-1.png', w: 48, h: 56 },
  'clockbug-walk-2': { file: 'enemies/clockbug-walk-2.png', w: 48, h: 56 },
  'clockbug-walk-3': { file: 'enemies/clockbug-walk-3.png', w: 48, h: 56 },
  'clockbug-walk-4': { file: 'enemies/clockbug-walk-4.png', w: 48, h: 56 },
  'coffee-bean': { file: 'enemies/coffee-bean-sprite.png', w: 39, h: 52 },
  'coffee-bean-sleep': { file: 'enemies/coffee-bean-sprite-sleep.png', w: 38, h: 52 },
  'coffee-bean-jump': { file: 'enemies/coffee-bean-sprite-jump.png', w: 39, h: 52 },
  'coffee-bean-land': { file: 'enemies/coffee-bean-sprite-land.png', w: 39, h: 52 },
  'night-bat': { file: 'enemies/night-bat.png', w: 56, h: 56 },
  'night-bat-sleep': { file: 'enemies/night-bat-sleep.png', w: 54, h: 56 },
  'night-bat-flap-1': { file: 'enemies/night-bat-flap-1.png', w: 56, h: 56 },
  'night-bat-flap-2': { file: 'enemies/night-bat-flap-2.png', w: 56, h: 56 },
  'night-bat-flap-3': { file: 'enemies/night-bat-flap-3.png', w: 56, h: 56 },
  'night-bat-flap-4': { file: 'enemies/night-bat-flap-4.png', w: 56, h: 56 },
  hedgehog: { file: 'enemies/insomnia-hedgehog.png', w: 57, h: 72 },
  'hedgehog-sleep': { file: 'enemies/insomnia-hedgehog-sleep.png', w: 61, h: 72 },
  'hedgehog-roll': { file: 'enemies/insomnia-hedgehog-roll.png', w: 48, h: 48 },
  'hedgehog-walk-1': { file: 'enemies/insomnia-hedgehog-walk-1.png', w: 57, h: 72 },
  'hedgehog-walk-2': { file: 'enemies/insomnia-hedgehog-walk-2.png', w: 57, h: 72 },
  'hedgehog-walk-3': { file: 'enemies/insomnia-hedgehog-walk-3.png', w: 57, h: 72 },
  'hedgehog-walk-4': { file: 'enemies/insomnia-hedgehog-walk-4.png', w: 57, h: 72 },
  owl: { file: 'enemies/night-owl-boss.png', w: 181, h: 200 },
  'owl-2': { file: 'enemies/night-owl-boss-phase2.png', w: 183, h: 200 },
  'owl-3': { file: 'enemies/night-owl-boss-phase3.png', w: 176, h: 200 },
  'owl-sleep': { file: 'enemies/night-owl-boss-sleep.png', w: 184, h: 200 },
  'owl-1-flap-1': { file: 'enemies/night-owl-boss-flap-1.png', w: 181, h: 200 },
  'owl-1-flap-2': { file: 'enemies/night-owl-boss-flap-2.png', w: 181, h: 200 },
  'owl-1-flap-3': { file: 'enemies/night-owl-boss-flap-3.png', w: 181, h: 200 },
  'owl-1-flap-4': { file: 'enemies/night-owl-boss-flap-4.png', w: 181, h: 200 },
  'owl-2-flap-1': { file: 'enemies/night-owl-boss-phase2-flap-1.png', w: 183, h: 200 },
  'owl-2-flap-2': { file: 'enemies/night-owl-boss-phase2-flap-2.png', w: 183, h: 200 },
  'owl-2-flap-3': { file: 'enemies/night-owl-boss-phase2-flap-3.png', w: 183, h: 200 },
  'owl-2-flap-4': { file: 'enemies/night-owl-boss-phase2-flap-4.png', w: 183, h: 200 },
  'owl-3-flap-1': { file: 'enemies/night-owl-boss-phase3-flap-1.png', w: 176, h: 200 },
  'owl-3-flap-2': { file: 'enemies/night-owl-boss-phase3-flap-2.png', w: 176, h: 200 },
  'owl-3-flap-3': { file: 'enemies/night-owl-boss-phase3-flap-3.png', w: 176, h: 200 },
  'owl-3-flap-4': { file: 'enemies/night-owl-boss-phase3-flap-4.png', w: 176, h: 200 },
  'owl-dive': { file: 'enemies/night-owl-boss-dive.png', w: 181, h: 200 },
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
  jellyfish: { file: 'enemies/w3-sleepy-jellyfish.png', w: 46, h: 60 },
  'jellyfish-sleep': { file: 'enemies/w3-sleepy-jellyfish-sleep.png', w: 48, h: 56 },
  clownfish: { file: 'enemies/w3-alarm-clownfish.png', w: 59, h: 48 },
  'clownfish-sleep': { file: 'enemies/w3-alarm-clownfish-sleep.png', w: 57, h: 48 },
  octopus: { file: 'enemies/w3-coffee-octopus.png', w: 52, h: 56 },
  'octopus-sleep': { file: 'enemies/w3-coffee-octopus-sleep.png', w: 52, h: 56 },
  puffer: { file: 'enemies/w3-puffer-fish.png', w: 66, h: 72 },
  'puffer-sleep': { file: 'enemies/w3-puffer-fish-sleep.png', w: 66, h: 72 },
  nessie: { file: 'enemies/w3-nessie-boss.png', w: 239, h: 220 },
  'nessie-2': { file: 'enemies/w3-nessie-boss-phase2.png', w: 238, h: 220 },
  'nessie-3': { file: 'enemies/w3-nessie-boss-phase3.png', w: 237, h: 220 },
  'nessie-sleep': { file: 'enemies/w3-nessie-boss-sleep.png', w: 238, h: 220 },
  squirrel: { file: 'enemies/w1-boss1-squirrel.png', w: 216, h: 150 },
  'squirrel-sleep': { file: 'enemies/w1-boss1-squirrel-sleep.png', w: 208, h: 150 },
  beaver: { file: 'enemies/w1-boss2-beaver.png', w: 160, h: 150 },
  'beaver-sleep': { file: 'enemies/w1-boss2-beaver-sleep.png', w: 161, h: 150 },
  camel: { file: 'enemies/w2-boss1-camel.png', w: 139, h: 150 },
  'camel-sleep': { file: 'enemies/w2-boss1-camel-sleep.png', w: 137, h: 150 },
  fennec: { file: 'enemies/w2-boss2-fennec-fox.png', w: 149, h: 150 },
  'fennec-sleep': { file: 'enemies/w2-boss2-fennec-fox-sleep.png', w: 148, h: 150 },
  'hermit-crab': { file: 'enemies/w3-boss1-hermit-crab.png', w: 112, h: 150 },
  'hermit-crab-sleep': { file: 'enemies/w3-boss1-hermit-crab-sleep.png', w: 110, h: 150 },
  eel: { file: 'enemies/w3-boss2-electric-eel.png', w: 102, h: 150 },
  'eel-sleep': { file: 'enemies/w3-boss2-electric-eel-sleep.png', w: 102, h: 130 },
  'b-acorn': { file: 'bullets/w1-acorn.png', w: 20, h: 26 },
  'b-log': { file: 'bullets/w1-log.png', w: 40, h: 18 },
  'b-water-wave': { file: 'bullets/w1-water-wave.png', w: 48, h: 28 },
  'b-spit': { file: 'bullets/w2-spit.png', w: 16, h: 16 },
  'b-sand-dust': { file: 'bullets/w2-sand-dust.png', w: 40, h: 24 },
  'b-bubble': { file: 'bullets/w3-bubble.png', w: 18, h: 18 },
  'b-electric-beam': { file: 'bullets/w3-electric-beam.png', w: 32, h: 16 },
  penguin: { file: 'enemies/w4-sleepy-penguin.png', w: 50, h: 56 },
  'penguin-sleep': { file: 'enemies/w4-sleepy-penguin-sleep.png', w: 50, h: 56 },
  snowman: { file: 'enemies/w4-coffee-snowman.png', w: 51, h: 60 },
  'snowman-sleep': { file: 'enemies/w4-coffee-snowman-sleep.png', w: 52, h: 60 },
  puffin: { file: 'enemies/w4-noisy-puffin.png', w: 54, h: 56 },
  'puffin-sleep': { file: 'enemies/w4-noisy-puffin-sleep.png', w: 55, h: 56 },
  walrus: { file: 'enemies/w4-walrus.png', w: 63, h: 72 },
  'walrus-sleep': { file: 'enemies/w4-walrus-sleep.png', w: 63, h: 72 },
  'polar-bear': { file: 'enemies/w4-boss1-polar-bear.png', w: 137, h: 150 },
  'polar-bear-sleep': { file: 'enemies/w4-boss1-polar-bear-sleep.png', w: 137, h: 150 },
  narwhal: { file: 'enemies/w4-boss2-narwhal.png', w: 149, h: 150 },
  'narwhal-sleep': { file: 'enemies/w4-boss2-narwhal-sleep.png', w: 125, h: 147 },
  yeti: { file: 'enemies/w4-yeti-boss.png', w: 227, h: 220 },
  'yeti-2': { file: 'enemies/w4-yeti-boss-phase2.png', w: 228, h: 220 },
  'yeti-3': { file: 'enemies/w4-yeti-boss-phase3.png', w: 230, h: 217 },
  'yeti-sleep': { file: 'enemies/w4-yeti-boss-sleep.png', w: 227, h: 220 },
  'ice-floor': { file: 'items/w4-ice-floor.png', w: 96, h: 24 },
  icicle: { file: 'items/w4-icicle.png', w: 24, h: 56 },
  'snow-platform': { file: 'items/w4-snow-platform.png', w: 96, h: 28 },
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

/** 全部素材:手寫的原圖與世界 1 動畫格,加上產生的世界 2–10 與 Boss 動畫格(animSprites.ts)。 */
export const SPRITES = { ...BASE_SPRITES, ...ANIM_SPRITES } as const;

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

/**
 * 網頁實際載入的路徑(相對網站根目錄):全部用 tools/build_web_assets.py 轉好的 WebP(有透明、檔案小很多)。
 * 美術原檔 PNG 留在 public/assets/ 方便修改。
 */
export function assetPath(key: SpriteKey): string {
  return `web/${SPRITES[key].file.replace(/\.png$/, '.webp')}`;
}

/** 貓頭鷹原圖 200 高,畫成 0.75 倍。 */
export const OWL_ART_SCALE = 0.75;

/** 人面獅身原圖 200 高,畫成 0.75 倍。 */
export const SPHINX_ART_SCALE = 0.75;

/** 尼斯湖水怪原圖 220 高,畫成 0.7 倍。 */
export const NESSIE_ART_SCALE = 0.7;

/** 小頭目原圖 150 高,畫成 0.8 倍。 */
export const MINI_BOSS_ART_SCALE = 0.8;

/** 畫的時候要縮放的魔物(關主與小頭目的原圖比較大)。 */
export const ENEMY_ART_SCALE: Partial<Record<EnemyType, number>> = {
  nightOwl: OWL_ART_SCALE,
  sphinx: SPHINX_ART_SCALE,
  nessie: NESSIE_ART_SCALE,
  squirrel: MINI_BOSS_ART_SCALE,
  beaver: MINI_BOSS_ART_SCALE,
  camel: MINI_BOSS_ART_SCALE,
  fennec: MINI_BOSS_ART_SCALE,
  hermitCrab: MINI_BOSS_ART_SCALE,
  eel: MINI_BOSS_ART_SCALE,
  polarBear: MINI_BOSS_ART_SCALE,
  narwhal: MINI_BOSS_ART_SCALE,
  yeti: 0.75,
};

/** 魔物的固定染色(目前沒有;保留給之後區分同一張圖的變種)。 */
export const ENEMY_ART_TINT: Partial<Record<EnemyType, number>> = {};

/**
 * 美術規格是「朝左」,但這幾張圖畫成朝右(人面獅身爪子朝右、尾巴在左;耳廓狐尾巴在左)。
 * 畫的時候反過來,關主才會面對玩家。
 */
export const ART_FACES_RIGHT: ReadonlySet<EnemyType> = new Set(['sphinx', 'fennec']);

/** 魔物圖的 key(之前有程式畫的暫代造型,美術全部畫好後只剩 SpriteKey)。 */
export type ArtKey = SpriteKey;

type PhasedBoss = 'nightOwl' | 'sphinx' | 'nessie' | 'yeti';

const ENEMY_AWAKE: Record<Exclude<EnemyType, PhasedBoss>, ArtKey> = {
  alarmBug: 'clockbug',
  coffeeBean: 'coffee-bean',
  nightBat: 'night-bat',
  hedgehog: 'hedgehog',
  squirrel: 'squirrel',
  beaver: 'beaver',
  bellScarab: 'bell-scarab',
  mummyCat: 'mummy-cat',
  sandSnake: 'sand-snake',
  vulture: 'vulture',
  tortoise: 'tortoise',
  camel: 'camel',
  fennec: 'fennec',
  jellyfish: 'jellyfish',
  clownfish: 'clownfish',
  octopus: 'octopus',
  puffer: 'puffer',
  hermitCrab: 'hermit-crab',
  eel: 'eel',
  penguin: 'penguin',
  snowman: 'snowman',
  puffin: 'puffin',
  walrus: 'walrus',
  polarBear: 'polar-bear',
  narwhal: 'narwhal',
};
const ENEMY_SLEEP: Record<Exclude<EnemyType, PhasedBoss>, ArtKey> = {
  alarmBug: 'clockbug-sleep',
  coffeeBean: 'coffee-bean-sleep',
  nightBat: 'night-bat-sleep',
  hedgehog: 'hedgehog-sleep',
  squirrel: 'squirrel-sleep',
  beaver: 'beaver-sleep',
  bellScarab: 'bell-scarab-sleep',
  mummyCat: 'mummy-cat-sleep',
  sandSnake: 'sand-snake-sleep',
  vulture: 'vulture-sleep',
  tortoise: 'tortoise-sleep',
  camel: 'camel-sleep',
  fennec: 'fennec-sleep',
  jellyfish: 'jellyfish-sleep',
  clownfish: 'clownfish-sleep',
  octopus: 'octopus-sleep',
  puffer: 'puffer-sleep',
  hermitCrab: 'hermit-crab-sleep',
  eel: 'eel-sleep',
  penguin: 'penguin-sleep',
  snowman: 'snowman-sleep',
  puffin: 'puffin-sleep',
  walrus: 'walrus-sleep',
  polarBear: 'polar-bear-sleep',
  narwhal: 'narwhal-sleep',
};
const BOSS_PHASES: Record<PhasedBoss, { 1: SpriteKey; 2: SpriteKey; 3: SpriteKey; sleep: SpriteKey }> = {
  nightOwl: { 1: 'owl', 2: 'owl-2', 3: 'owl-3', sleep: 'owl-sleep' },
  sphinx: { 1: 'sphinx', 2: 'sphinx-2', 3: 'sphinx-3', sleep: 'sphinx-sleep' },
  nessie: { 1: 'nessie', 2: 'nessie-2', 3: 'nessie-3', sleep: 'nessie-sleep' },
  yeti: { 1: 'yeti', 2: 'yeti-2', 3: 'yeti-3', sleep: 'yeti-sleep' },
};

export function enemySprite(type: EnemyType, state: 'awake' | 'sleep', phase: 1 | 2 | 3 = 1): ArtKey {
  if (type === 'nightOwl' || type === 'sphinx' || type === 'nessie' || type === 'yeti') return state === 'sleep' ? BOSS_PHASES[type].sleep : BOSS_PHASES[type][phase];
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
