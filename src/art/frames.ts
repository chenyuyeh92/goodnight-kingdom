import type { EnemyPhase, EnemyType } from '../game/enemies';
import type { SpriteKey } from './sprites';

/**
 * 美術畫的動畫格(世界 1:鬧鐘蟲、刺蝟走路,蝙蝠、貓頭鷹拍翅,咖啡豆跳起/蹲下,小綿羊守衛走路與跳躍)。
 * 每一格畫布大小、腳底位置都和原圖一樣;上下晃動與跳躍高度由程式的 Pose 控制。
 * 沒有動畫格的魔物回傳 null,照舊用單張圖加程式的伸縮。
 */

const WALK_FRAME_MS = 120;
const FLAP_FRAME_MS = 90;
const OWL_FLAP_FRAME_MS = 140;
/** 咖啡豆起跳前這段時間蹲下(0.9 秒跳一次)。 */
const COFFEE_CROUCH_FROM_MS = 750;
/** 貓頭鷹往下衝得夠快才換俯衝格。 */
const OWL_DIVE_VY = 150;

const cycle = (keys: readonly SpriteKey[], tMs: number, frameMs: number): SpriteKey => keys[Math.floor(tMs / frameMs) % keys.length];

const CLOCKBUG_WALK: readonly SpriteKey[] = ['clockbug-walk-1', 'clockbug-walk-2', 'clockbug-walk-3', 'clockbug-walk-4'];
const HEDGEHOG_WALK: readonly SpriteKey[] = ['hedgehog-walk-1', 'hedgehog-walk-2', 'hedgehog-walk-3', 'hedgehog-walk-4'];
const BAT_FLAP: readonly SpriteKey[] = ['night-bat-flap-1', 'night-bat-flap-2', 'night-bat-flap-3', 'night-bat-flap-4'];
const OWL_FLAP: Record<1 | 2 | 3, readonly SpriteKey[]> = {
  1: ['owl-1-flap-1', 'owl-1-flap-2', 'owl-1-flap-3', 'owl-1-flap-4'],
  2: ['owl-2-flap-1', 'owl-2-flap-2', 'owl-2-flap-3', 'owl-2-flap-4'],
  3: ['owl-3-flap-1', 'owl-3-flap-2', 'owl-3-flap-3', 'owl-3-flap-4'],
};
const GUARD_WALK: readonly SpriteKey[] = ['guard-walk-1', 'guard-walk-2', 'guard-walk-3', 'guard-walk-4'];

export interface FrameInput {
  phase: EnemyPhase;
  /** 行為狀態的計時(咖啡豆用來判斷快要起跳)。 */
  timerMs: number;
  tMs: number;
  vx: number;
  vy: number;
  grounded: boolean;
  /** 貓頭鷹的階段。 */
  bossPhase: 1 | 2 | 3;
}

/** 這一格魔物要用哪一張動畫格;沒有動畫格時為 null。 */
export function enemyFrame(type: EnemyType, f: FrameInput): SpriteKey | null {
  switch (type) {
    case 'alarmBug':
      return Math.abs(f.vx) > 5 ? cycle(CLOCKBUG_WALK, f.tMs, WALK_FRAME_MS) : null;
    case 'hedgehog':
      return f.phase === 'walk' && Math.abs(f.vx) > 5 ? cycle(HEDGEHOG_WALK, f.tMs, WALK_FRAME_MS * 1.5) : null;
    case 'nightBat':
      return cycle(BAT_FLAP, f.tMs, FLAP_FRAME_MS);
    case 'coffeeBean':
      if (!f.grounded) return 'coffee-bean-jump';
      return f.timerMs >= COFFEE_CROUCH_FROM_MS ? 'coffee-bean-land' : null;
    case 'nightOwl':
      if (f.vy > OWL_DIVE_VY) return 'owl-dive';
      return cycle(OWL_FLAP[f.bossPhase], f.tMs, OWL_FLAP_FRAME_MS);
    default:
      return null;
  }
}

/** 小綿羊守衛(預設角色)的動畫格:空中用跳躍格、走路用走路格;站著或玩家自己畫的守衛回傳 null。 */
export function guardFrame(tMs: number, vx: number, grounded: boolean): SpriteKey | null {
  if (!grounded) return 'guard-jump';
  return Math.abs(vx) > 5 ? cycle(GUARD_WALK, tMs, WALK_FRAME_MS) : null;
}
