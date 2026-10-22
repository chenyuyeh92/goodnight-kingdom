import type { PlayMode } from '../input/playMode';

/** 1-1 路邊的教學告示牌。 */
export type HintKind = 'move' | 'jump' | 'aimUp' | 'crouch' | 'melee' | 'chest';

export const HINT_KINDS: readonly HintKind[] = ['move', 'jump', 'aimUp', 'crouch', 'melee', 'chest'];

const WHAT: Record<HintKind, string> = {
  move: '往右走,邊走邊射擊',
  jump: '跳過荊棘',
  aimUp: '往上射天上的魔物',
  crouch: '蹲下躲開低飛的蝙蝠',
  melee: '貼近魔物會揮枕頭,傷害更高',
  chest: '寶箱裡有新武器,碰到就打開',
};

const KEYS: Record<HintKind, { a: string; b: string; touch: string } | null> = {
  move: { a: 'A D 走  C 射擊', b: '← → 走  , 射擊', touch: '左邊拖曳走路、右邊按射擊' },
  jump: { a: 'V', b: '.', touch: '跳躍鈕' },
  aimUp: { a: '按住 W', b: '按住 ↑', touch: '左邊往上拖' },
  crouch: { a: '按住 S', b: '按住 ↓', touch: '左邊往下拖' },
  melee: { a: 'C', b: ',', touch: '射擊鈕' },
  chest: null,
};

/** 告示牌文字:依單人/雙人與是否觸控顯示對應的按鍵。 */
export function hintText(kind: HintKind, mode: PlayMode, touch: boolean): string {
  const k = KEYS[kind];
  if (!k) return WHAT[kind];
  if (touch) return `${WHAT[kind]}(${k.touch})`;
  if (mode === 'duo') return `${WHAT[kind]}(A:${k.a}  B:${k.b})`;
  return `${WHAT[kind]}(${k.a})`;
}
