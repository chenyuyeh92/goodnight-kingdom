import type { PlayMode } from '../input/playMode';

/** 路邊的教學告示牌(1-1 教操作,世界 2 教流沙與壓力板)。 */
export type HintKind = 'move' | 'jump' | 'aimUp' | 'crouch' | 'melee' | 'chest' | 'quicksand' | 'plate' | 'swim' | 'dive' | 'current' | 'ice' | 'icicle' | 'lava' | 'eruption';

export const HINT_KINDS: readonly HintKind[] = ['move', 'jump', 'aimUp', 'crouch', 'melee', 'chest', 'quicksand', 'plate', 'swim', 'dive', 'current', 'ice', 'icicle', 'lava', 'eruption'];

const WHAT: Record<HintKind, string> = {
  move: '往右走,邊走邊射擊',
  jump: '跳過荊棘',
  aimUp: '往上射天上的魔物',
  crouch: '蹲下躲開低飛的蝙蝠',
  melee: '貼近魔物會揮枕頭,傷害更高',
  chest: '寶箱裡有新武器,碰到就打開',
  quicksand: '流沙會變慢,站太久會陷下去,快走過去或跳過去',
  plate: '踩到壓力板會掉沙磚,看到影子快躲開',
  swim: '在水裡按跳躍往上游,放開會慢慢沉下去',
  dive: '按住下可以往下潛,子彈也會往下射',
  current: '水流會把你推著走,氣泡柱會把你往上送',
  ice: '冰面很滑,起步慢、停不下來,提早放開',
  icicle: '上面的冰柱會掉下來,看到影子快走開',
  lava: '熔岩碰到會燙傷,跳過去或踩岩石平台',
  eruption: '火山噴發時會掉石頭,看到影子快走開',
};

const KEYS: Record<HintKind, { a: string; b: string; touch: string } | null> = {
  move: { a: 'A D 走  C 射擊', b: '← → 走  , 射擊', touch: '左邊拖曳走路、右邊按射擊' },
  jump: { a: 'V', b: '.', touch: '跳躍鈕' },
  aimUp: { a: '按住 W', b: '按住 ↑', touch: '左邊往上拖' },
  crouch: { a: '按住 S', b: '按住 ↓', touch: '左邊往下拖' },
  melee: { a: 'C', b: ',', touch: '射擊鈕' },
  chest: null,
  quicksand: null,
  plate: null,
  swim: { a: 'V', b: '.', touch: '跳躍鈕' },
  dive: { a: '按住 S', b: '按住 ↓', touch: '左邊往下拖' },
  current: null,
  ice: null,
  icicle: null,
  lava: null,
  eruption: null,
};

/** 告示牌文字:依單人/雙人與是否觸控顯示對應的按鍵。 */
export function hintText(kind: HintKind, mode: PlayMode, touch: boolean): string {
  const k = KEYS[kind];
  if (!k) return WHAT[kind];
  if (touch) return `${WHAT[kind]}(${k.touch})`;
  if (mode === 'duo') return `${WHAT[kind]}(A:${k.a}  B:${k.b})`;
  return `${WHAT[kind]}(${k.a})`;
}
