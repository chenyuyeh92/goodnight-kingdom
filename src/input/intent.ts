export interface Intent {
  left: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
  jump: boolean;
  shoot: boolean;
}

export const EMPTY_INTENT: Readonly<Intent> = Object.freeze({
  left: false,
  right: false,
  up: false,
  down: false,
  jump: false,
  shoot: false,
});

export function mergeIntents(a: Intent, b: Intent): Intent {
  return {
    left: a.left || b.left,
    right: a.right || b.right,
    up: a.up || b.up,
    down: a.down || b.down,
    jump: a.jump || b.jump,
    shoot: a.shoot || b.shoot,
  };
}
