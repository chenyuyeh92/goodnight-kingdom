import { EMPTY_INTENT, type Intent } from './intent';

export const JOYSTICK_DEADZONE = 12;
export const JOYSTICK_X_THRESHOLD = 16;
export const JOYSTICK_Y_THRESHOLD = 32;
/** 只影響畫面上小圓點能拉多遠。 */
export const JOYSTICK_MAX_RADIUS = 60;

/** 浮動搖桿的位移轉成方向;斜向可同時成立(邊走邊往上瞄準)。 */
export function joystickIntent(dx: number, dy: number): Pick<Intent, 'left' | 'right' | 'up' | 'down'> {
  if (Math.hypot(dx, dy) < JOYSTICK_DEADZONE) return { left: false, right: false, up: false, down: false };
  return {
    left: dx < -JOYSTICK_X_THRESHOLD,
    right: dx > JOYSTICK_X_THRESHOLD,
    up: dy < -JOYSTICK_Y_THRESHOLD,
    down: dy > JOYSTICK_Y_THRESHOLD,
  };
}

export type TouchRole = 'stick' | 'shoot' | 'jump';

interface Finger {
  role: TouchRole;
  originX: number;
  originY: number;
  x: number;
  y: number;
}

/** 多點觸控狀態:每隻手指的角色在按下時決定,之後滑到哪裡都不變。 */
export class TouchState {
  private readonly fingers = new Map<number, Finger>();

  down(id: number, role: TouchRole, x: number, y: number): void {
    // 搖桿只認第一隻手指,第二隻放在左半邊不會讓搖桿中心亂跳。
    if (role === 'stick' && [...this.fingers.values()].some((f) => f.role === 'stick')) return;
    this.fingers.set(id, { role, originX: x, originY: y, x, y });
  }

  move(id: number, x: number, y: number): void {
    const f = this.fingers.get(id);
    if (!f) return;
    f.x = x;
    f.y = y;
  }

  up(id: number): void {
    this.fingers.delete(id);
  }

  clear(): void {
    this.fingers.clear();
  }

  intent(): Intent {
    const roles = [...this.fingers.values()];
    const stick = this.stick();
    const dir = stick ? joystickIntent(stick.dx, stick.dy) : joystickIntent(0, 0);
    return {
      ...EMPTY_INTENT,
      ...dir,
      shoot: roles.some((f) => f.role === 'shoot'),
      jump: roles.some((f) => f.role === 'jump'),
    };
  }

  stick(): { originX: number; originY: number; dx: number; dy: number } | null {
    const f = [...this.fingers.values()].find((g) => g.role === 'stick');
    return f ? { originX: f.originX, originY: f.originY, dx: f.x - f.originX, dy: f.y - f.originY } : null;
  }
}
