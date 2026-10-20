import type { Intent } from './intent';

export interface KeyBinding {
  left: string;
  right: string;
  up: string;
  down: string;
  jump: string;
  shoot: string;
}

export const PLAYER_A_KEYS: KeyBinding = {
  left: 'KeyA',
  right: 'KeyD',
  up: 'KeyW',
  down: 'KeyS',
  jump: 'KeyG',
  shoot: 'KeyF',
};

export const PLAYER_B_KEYS: KeyBinding = {
  left: 'ArrowLeft',
  right: 'ArrowRight',
  up: 'ArrowUp',
  down: 'ArrowDown',
  jump: 'Period',
  shoot: 'Comma',
};

export const GAME_CODES: ReadonlySet<string> = new Set([
  ...Object.values(PLAYER_A_KEYS),
  ...Object.values(PLAYER_B_KEYS),
]);

/** 相反方向同時按住時兩者都不算,避免角色抖動。 */
export function intentFromKeys(pressed: ReadonlySet<string>, binding: KeyBinding): Intent {
  const left = pressed.has(binding.left);
  const right = pressed.has(binding.right);
  const up = pressed.has(binding.up);
  const down = pressed.has(binding.down);
  return {
    left: left && !right,
    right: right && !left,
    up: up && !down,
    down: down && !up,
    jump: pressed.has(binding.jump),
    shoot: pressed.has(binding.shoot),
  };
}
