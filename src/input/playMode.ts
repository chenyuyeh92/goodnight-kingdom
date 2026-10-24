import { EMPTY_INTENT, mergeIntents, type Intent } from './intent';
import { PLAYER_A_KEYS, PLAYER_B_KEYS, intentFromKeys } from './keyBindings';
import { tr } from '../i18n/lang';

export type PlayMode = 'single' | 'duo';

export function parsePlayMode(value: string | null): PlayMode | null {
  return value === 'single' || value === 'duo' ? value : null;
}

/**
 * 單人:兩組按鍵都操控同一個角色;雙人:A 組給玩家 A,B 組給玩家 B。觸控一律給玩家 A。
 * 線上雙人(房主這台,remote 不是 undefined):這台的按鍵和觸控都給 A,B 用朋友傳來的操作(斷線時是 null,B 不動)。
 */
export function intentsForMode(pressed: ReadonlySet<string>, mode: PlayMode, touch?: Intent, remote?: Intent | null): Intent[] {
  let a = intentFromKeys(pressed, PLAYER_A_KEYS);
  if (touch) a = mergeIntents(a, touch);
  const b = intentFromKeys(pressed, PLAYER_B_KEYS);
  if (mode === 'single') return [mergeIntents(a, b)];
  if (remote !== undefined) return [mergeIntents(a, b), remote ?? { ...EMPTY_INTENT }];
  return [a, b];
}

/** 畫面左上角的操作提示。 */
export function controlHint(mode: PlayMode, touch = false): string {
  if (touch) return tr('左邊拖曳:移動/往上瞄準/蹲下   右邊:射擊、跳躍', 'Drag on the left: move / aim up / crouch   Right: shoot, jump');
  if (mode === 'single') return tr('A D 移動  W 上  S 蹲/下  C 射擊  V 跳躍(方向鍵 , . 也可以)', 'A D move  W up  S crouch/down  C shoot  V jump (or arrows , .)');
  return tr('A:A D 移動  W 上  S 蹲/下  C 射擊  V 跳躍    B:← → 移動  ↑ 上  ↓ 蹲/下  , 射擊  . 跳躍', 'A: AD move W up S down C shoot V jump    B: ←→ move ↑ up ↓ down , shoot . jump');
}
