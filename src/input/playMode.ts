import { mergeIntents, type Intent } from './intent';
import { PLAYER_A_KEYS, PLAYER_B_KEYS, intentFromKeys } from './keyBindings';
import { tr } from '../i18n/lang';

export type PlayMode = 'single' | 'duo';

export function parsePlayMode(value: string | null): PlayMode | null {
  return value === 'single' || value === 'duo' ? value : null;
}

/** 單人:兩組按鍵都操控同一個角色;雙人:A 組給玩家 A,B 組給玩家 B。觸控一律給玩家 A。 */
export function intentsForMode(pressed: ReadonlySet<string>, mode: PlayMode, touch?: Intent): Intent[] {
  let a = intentFromKeys(pressed, PLAYER_A_KEYS);
  if (touch) a = mergeIntents(a, touch);
  const b = intentFromKeys(pressed, PLAYER_B_KEYS);
  return mode === 'single' ? [mergeIntents(a, b)] : [a, b];
}

/** 畫面左上角的操作提示。 */
export function controlHint(mode: PlayMode, touch = false): string {
  if (touch) return tr('左邊拖曳:移動/往上瞄準/蹲下   右邊:射擊、跳躍', 'Drag on the left: move / aim up / crouch   Right: shoot, jump');
  if (mode === 'single') return tr('A D 移動  W 上  S 蹲/下  C 射擊  V 跳躍(方向鍵 , . 也可以)', 'A D move  W up  S crouch/down  C shoot  V jump (or arrows , .)');
  return tr('A:A D 移動  W 上  S 蹲/下  C 射擊  V 跳躍    B:← → 移動  ↑ 上  ↓ 蹲/下  , 射擊  . 跳躍', 'A: AD move W up S down C shoot V jump    B: ←→ move ↑ up ↓ down , shoot . jump');
}
