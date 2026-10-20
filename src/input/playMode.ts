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
