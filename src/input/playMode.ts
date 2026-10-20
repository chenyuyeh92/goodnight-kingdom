import { mergeIntents, type Intent } from './intent';
import { PLAYER_A_KEYS, PLAYER_B_KEYS, intentFromKeys } from './keyBindings';

export type PlayMode = 'single' | 'duo';

export function parsePlayMode(value: string | null): PlayMode | null {
  return value === 'single' || value === 'duo' ? value : null;
}

/** 單人:兩組按鍵都操控同一個角色;雙人:A 組給玩家 A,B 組給玩家 B。 */
export function intentsForMode(pressed: ReadonlySet<string>, mode: PlayMode): Intent[] {
  const a = intentFromKeys(pressed, PLAYER_A_KEYS);
  const b = intentFromKeys(pressed, PLAYER_B_KEYS);
  return mode === 'single' ? [mergeIntents(a, b)] : [a, b];
}

/** 畫面左上角的操作提示。 */
export function controlHint(mode: PlayMode): string {
  if (mode === 'single') return 'A D 移動  W 上  S 蹲/下  C 射擊  V 跳躍(方向鍵 , . 也可以)';
  return 'A:A D 移動  W 上  S 蹲/下  C 射擊  V 跳躍    B:← → 移動  ↑ 上  ↓ 蹲/下  , 射擊  . 跳躍';
}
