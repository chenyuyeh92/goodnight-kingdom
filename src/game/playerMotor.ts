import type { Intent } from '../input/intent';
import { MAX_DT_MS, type Tuning } from '../config/tuning';

export type Facing = 1 | -1;
export type Aim = 'forward' | 'up' | 'down';

export interface MotorState {
  facing: Facing;
  crouching: boolean;
  aim: Aim;
  coyoteMs: number;
  jumpBufferMs: number;
  prevJump: boolean;
}

export interface MotorInput {
  intent: Intent;
  grounded: boolean;
  /** 以站姿判定範圍檢查頭上是否有空間。 */
  canStand: boolean;
  dtMs: number;
}

export interface MotorOutput {
  state: MotorState;
  vx: number;
  /** 本格起跳時的垂直速度,沒起跳為 null。 */
  jumpVy: number | null;
}

export const STAND_HITBOX = { w: 28, h: 48 } as const;
export const CROUCH_HITBOX = { w: 28, h: 28 } as const;

export function initialMotorState(): MotorState {
  return { facing: 1, crouching: false, aim: 'forward', coyoteMs: 0, jumpBufferMs: 0, prevJump: false };
}

export function stepMotor(s: MotorState, input: MotorInput, t: Tuning): MotorOutput {
  const { intent, grounded, canStand } = input;
  const dt = Math.min(input.dtMs, MAX_DT_MS);

  const jumpPressed = intent.jump && !s.prevJump;
  let jumpBufferMs = jumpPressed ? t.jumpBufferMs : Math.max(0, s.jumpBufferMs - dt);
  let coyoteMs = grounded ? t.coyoteMs : Math.max(0, s.coyoteMs - dt);

  const wantCrouch = grounded && intent.down && !intent.up;
  let crouching = wantCrouch || (s.crouching && !canStand);

  let jumpVy: number | null = null;
  if (jumpBufferMs > 0 && (grounded || coyoteMs > 0) && (!crouching || canStand)) {
    jumpVy = -t.jumpVelocity;
    jumpBufferMs = 0;
    coyoteMs = 0;
    crouching = false;
  }

  const dir = intent.left && !intent.right ? -1 : intent.right && !intent.left ? 1 : 0;
  const facing: Facing = dir === 0 ? s.facing : (dir as Facing);
  const speed = crouching ? t.crawlSpeed : grounded ? t.walkSpeed : t.airSpeed;

  const aim: Aim = intent.up && !intent.down ? 'up' : !grounded && intent.down && !intent.up ? 'down' : 'forward';

  return {
    state: { facing, crouching, aim, coyoteMs, jumpBufferMs, prevJump: intent.jump },
    vx: dir * speed,
    jumpVy,
  };
}
