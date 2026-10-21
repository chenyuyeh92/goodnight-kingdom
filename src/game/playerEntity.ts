import Phaser from 'phaser';
import type { Tuning } from '../config/tuning';
import type { Intent } from '../input/intent';
import type { PlayerDebug } from '../main';
import { bulletVelocity, muzzleOffset } from './fire';
import { initialAttackState, stepAttack, type AttackState, type MeleeReach } from './melee';
import { freshHealth, type Health } from './health';
import { CROUCH_HITBOX, STAND_HITBOX, initialMotorState, stepMotor, type MotorState } from './playerMotor';
import { BASE_LOADOUT, activeWeapon, canFire, coolWeapon, fireWeapon, type Loadout, type WeaponDef } from './weapons';
import { NO_BUFFS, fireIntervalWithBuffs, tickBuffs, type Buffs } from './items';

const DOWN_HEIGHT = 20;
/** 小綿羊守衛圖:站著 48×55,蹲下壓扁,睡著躺平。 */
const ART_STAND = { w: 48, h: 55 };
const ART_CROUCH = { w: 54, h: 34 };
const DOWN_ALPHA = 0.6;
const BLINK_MS = 100;

export interface PlayerEntityOptions {
  x: number;
  feetY: number;
  color: number;
  /** 頭上的標籤,單人模式為 null。 */
  label: string | null;
  isTerrain: (body: unknown) => boolean;
  /** 圖片染色(雙人的 B 用淡綠色區分),不染色為 null。 */
  artTint: number | null;
}

export type AttackResult =
  | { kind: 'none' }
  | { kind: 'bullet'; spawn: BulletSpawn; weapon: WeaponDef }
  | { kind: 'melee'; reach: MeleeReach };

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
  attack: AttackState = initialAttackState();
  health: Health = freshHealth();
  loadout: Loadout = { ...BASE_LOADOUT };
  buffs: Buffs = { ...NO_BUFFS };

  private readonly sprite: Phaser.GameObjects.Rectangle;
  private readonly tag: Phaser.GameObjects.Text | null;
  private readonly zzz: Phaser.GameObjects.Text;
  private readonly art: Phaser.GameObjects.Image | null;

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
    this.art = scene.textures.exists('guard') ? scene.add.image(opts.x, opts.feetY, 'guard').setOrigin(0.5, 1) : null;
    if (this.art) {
      this.sprite.setVisible(false);
      if (opts.artTint !== null) this.art.setTint(opts.artTint);
    }
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

  /** 更新動作與攻擊;面前有近身目標時揮擊,否則射泡泡。睡著時不動也不攻擊。 */
  update(intent: Intent, dtMs: number, t: Tuning, hasMeleeTarget: (reach: MeleeReach) => boolean): AttackResult {
    const pb = this.body();
    pb.setGravityY(t.gravity);
    this.loadout = coolWeapon(this.loadout, dtMs);
    this.buffs = tickBuffs(this.buffs, dtMs);
    if (this.health.down) {
      pb.setVelocityX(0);
      return { kind: 'none' };
    }

    const grounded = pb.blocked.down || pb.touching.down;
    const feetY = pb.bottom;
    const out = stepMotor(this.motor, { intent, grounded, canStand: this.canStand(pb.center.x, feetY), dtMs }, t);
    if (out.state.crouching !== this.motor.crouching) this.resizeBody(out.state.crouching, feetY);
    this.motor = out.state;
    pb.setVelocity(out.vx, out.jumpVy ?? pb.velocity.y);

    const m = this.motor;
    const reach: MeleeReach = {
      x: this.zone.x,
      feetY: pb.bottom,
      h: m.crouching ? CROUCH_HITBOX.h : STAND_HITBOX.h,
      facing: m.facing,
      aim: m.aim,
    };
    // 過熱時不能射擊,但枕頭揮擊照常可用。
    const near = intent.shoot && hasMeleeTarget(reach);
    const shooting = near || (intent.shoot && canFire(this.loadout));
    const weapon = activeWeapon(this.loadout);
    const interval = fireIntervalWithBuffs(weapon.fireIntervalMs ?? t.fireIntervalMs, this.buffs);
    const r = stepAttack(this.attack, shooting, near, dtMs, interval);
    this.attack = r.state;
    if (r.action === 'melee') return { kind: 'melee', reach };
    if (r.action === 'none') return { kind: 'none' };
    this.loadout = fireWeapon(this.loadout, this.buffs.starMs > 0);
    const off = muzzleOffset(m.aim, m.facing, m.crouching);
    const v = bulletVelocity(m.aim, m.facing, weapon.speed ?? t.bulletSpeed);
    return { kind: 'bullet', weapon, spawn: { x: this.zone.x + off.x, y: pb.bottom + off.y, vx: v.vx, vy: v.vy } };
  }

  clampX(minX: number, maxX: number): void {
    if (this.zone.x < minX) this.zone.x = minX;
    if (this.zone.x > maxX) this.zone.x = maxX;
  }

  /** 移到指定位置並恢復站姿(復活用)。 */
  teleport(x: number, feetY: number): void {
    if (this.motor.crouching) this.resizeBody(false, feetY);
    this.motor = { ...initialMotorState(), facing: this.motor.facing };
    this.attack = initialAttackState();
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
    const top = this.art ? this.renderArt(feetY, down, blinking) : h;
    this.tag?.setPosition(this.zone.x, feetY - top - 4);
    this.zzz.setVisible(down).setPosition(this.zone.x + 28, feetY - top - 4);
  }

  /** 畫小綿羊,回傳圖的高度(標籤放在上面)。 */
  private renderArt(feetY: number, down: boolean, blinking: boolean): number {
    const art = this.art!;
    art.setFlipX(this.motor.facing < 0);
    if (down) {
      art.setOrigin(0.5, 0.5).setAngle(this.motor.facing < 0 ? -90 : 90);
      art.setDisplaySize(ART_STAND.w, ART_STAND.h).setPosition(this.zone.x, feetY - ART_STAND.w / 2).setAlpha(DOWN_ALPHA);
      return ART_STAND.w;
    }
    const size = this.motor.crouching ? ART_CROUCH : ART_STAND;
    art.setOrigin(0.5, 1).setAngle(0).setDisplaySize(size.w, size.h).setPosition(this.zone.x, feetY);
    art.setAlpha(blinking ? 0.3 : 1);
    return size.h;
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
      weapon: activeWeapon(this.loadout).id,
      ammo: this.loadout.ammo,
      heat: this.loadout.heat,
      overheated: this.loadout.overheated,
      cocoa: this.buffs.cocoaMs > 0,
      star: this.buffs.starMs > 0,
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
