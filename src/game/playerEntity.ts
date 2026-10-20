import Phaser from 'phaser';
import type { Tuning } from '../config/tuning';
import type { Intent } from '../input/intent';
import type { PlayerDebug } from '../main';
import { bulletVelocity, initialFireState, muzzleOffset, stepFire, type FireState } from './fire';
import { freshHealth, type Health } from './health';
import { CROUCH_HITBOX, STAND_HITBOX, initialMotorState, stepMotor, type MotorState } from './playerMotor';

const DOWN_HEIGHT = 20;
const BLINK_MS = 100;

export interface PlayerEntityOptions {
  x: number;
  feetY: number;
  color: number;
  /** 頭上的標籤,單人模式為 null。 */
  label: string | null;
  isTerrain: (body: unknown) => boolean;
}

export interface BulletSpawn {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

/** 一個角色:物理 body、繪圖、動作、射擊與愛心。 */
export class PlayerEntity {
  readonly zone: Phaser.GameObjects.Zone;
  motor: MotorState = initialMotorState();
  fire: FireState = initialFireState();
  health: Health = freshHealth();

  private readonly sprite: Phaser.GameObjects.Rectangle;
  private readonly tag: Phaser.GameObjects.Text | null;
  private readonly zzz: Phaser.GameObjects.Text;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly opts: PlayerEntityOptions,
  ) {
    this.zone = scene.add.zone(opts.x, opts.feetY - STAND_HITBOX.h / 2, STAND_HITBOX.w, STAND_HITBOX.h);
    scene.physics.add.existing(this.zone);
    this.sprite = scene.add.rectangle(opts.x, opts.feetY, STAND_HITBOX.w, STAND_HITBOX.h, opts.color).setOrigin(0.5, 1);
    this.tag = opts.label
      ? scene.add.text(opts.x, opts.feetY, opts.label, { fontSize: '16px', color: '#f3e9d2' }).setOrigin(0.5, 1)
      : null;
    this.zzz = scene.add.text(opts.x, opts.feetY, 'Zzz', { fontSize: '18px', color: '#f3e9d2' }).setOrigin(0.5, 1).setVisible(false);
  }

  body(): Phaser.Physics.Arcade.Body {
    return this.zone.body as Phaser.Physics.Arcade.Body;
  }

  get x(): number {
    return this.zone.x;
  }

  get feetY(): number {
    return this.body().bottom;
  }

  /** 更新動作與射擊,回傳本格要發射的子彈。睡著時不動也不射擊。 */
  update(intent: Intent, dtMs: number, t: Tuning): BulletSpawn | null {
    const pb = this.body();
    pb.setGravityY(t.gravity);
    if (this.health.down) {
      pb.setVelocityX(0);
      return null;
    }

    const grounded = pb.blocked.down || pb.touching.down;
    const feetY = pb.bottom;
    const out = stepMotor(this.motor, { intent, grounded, canStand: this.canStand(pb.center.x, feetY), dtMs }, t);
    if (out.state.crouching !== this.motor.crouching) this.resizeBody(out.state.crouching, feetY);
    this.motor = out.state;
    pb.setVelocity(out.vx, out.jumpVy ?? pb.velocity.y);

    const shot = stepFire(this.fire, intent.shoot, dtMs, t.fireIntervalMs);
    this.fire = shot.state;
    if (!shot.fired) return null;
    const m = this.motor;
    const off = muzzleOffset(m.aim, m.facing, m.crouching);
    const v = bulletVelocity(m.aim, m.facing, t.bulletSpeed);
    return { x: this.zone.x + off.x, y: pb.bottom + off.y, vx: v.vx, vy: v.vy };
  }

  clampX(minX: number, maxX: number): void {
    if (this.zone.x < minX) this.zone.x = minX;
    if (this.zone.x > maxX) this.zone.x = maxX;
  }

  /** 移到指定位置並恢復站姿(復活用)。 */
  teleport(x: number, feetY: number): void {
    if (this.motor.crouching) this.resizeBody(false, feetY);
    this.motor = { ...initialMotorState(), facing: this.motor.facing };
    this.fire = initialFireState();
    this.body().reset(x, feetY - STAND_HITBOX.h / 2);
  }

  render(timeMs: number): void {
    const down = this.health.down;
    const h = down ? DOWN_HEIGHT : this.motor.crouching ? CROUCH_HITBOX.h : STAND_HITBOX.h;
    const feetY = this.zone.y + this.body().height / 2;
    this.sprite.setPosition(this.zone.x, feetY);
    this.sprite.setSize(STAND_HITBOX.w, h);
    this.sprite.setDisplaySize(down ? STAND_HITBOX.w + 12 : STAND_HITBOX.w, h);
    const blinking = !down && this.health.invulnMs > 0 && Math.floor(timeMs / BLINK_MS) % 2 === 0;
    this.sprite.setAlpha(down ? 0.5 : blinking ? 0.3 : 1);
    this.tag?.setPosition(this.zone.x, feetY - h - 4);
    this.zzz.setVisible(down).setPosition(this.zone.x + 10, feetY - h - (this.tag ? 22 : 4));
  }

  debug(): PlayerDebug {
    return {
      x: this.zone.x,
      y: this.body().bottom,
      crouching: this.motor.crouching,
      aim: this.motor.aim,
      facing: this.motor.facing,
      hearts: this.health.hearts,
      down: this.health.down,
      invuln: this.health.invulnMs > 0,
    };
  }

  /** 以站姿大小檢查頭上有沒有地形。 */
  private canStand(centerX: number, feetY: number): boolean {
    const hits = this.scene.physics.overlapRect(
      centerX - STAND_HITBOX.w / 2,
      feetY - STAND_HITBOX.h,
      STAND_HITBOX.w,
      STAND_HITBOX.h - 1,
      false,
      true,
    );
    return !hits.some((b) => this.opts.isTerrain(b));
  }

  /** 切換判定範圍時保持腳底位置不變。 */
  private resizeBody(crouching: boolean, feetY: number): void {
    const box = crouching ? CROUCH_HITBOX : STAND_HITBOX;
    const pb = this.body();
    const vy = pb.velocity.y;
    // reset() 會清掉著地旗標;高更新率螢幕上下一格可能沒有物理步驟重新偵測,會誤判騰空而站起來。
    const blockedDown = pb.blocked.down;
    const touchingDown = pb.touching.down;
    this.zone.setSize(box.w, box.h);
    pb.setSize(box.w, box.h, true);
    pb.reset(this.zone.x, feetY - box.h / 2);
    pb.velocity.y = vy;
    pb.blocked.down = blockedDown;
    pb.touching.down = touchingDown;
  }
}
