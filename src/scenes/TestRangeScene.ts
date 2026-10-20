import Phaser from 'phaser';
import { DEFAULT_TUNING, MAX_DT_MS, type Tuning } from '../config/tuning';
import { mergeIntents } from '../input/intent';
import { PLAYER_A_KEYS, PLAYER_B_KEYS, intentFromKeys } from '../input/keyBindings';
import { KeyboardSource } from '../input/keyboardSource';
import { CROUCH_HITBOX, STAND_HITBOX, initialMotorState, stepMotor, type MotorState } from '../game/playerMotor';
import { bulletVelocity, initialFireState, muzzleOffset, stepFire, type FireState } from '../game/fire';
import { advanceCamera, minPlayerX } from '../game/camera';

const VIEW_W = 960;
const WORLD_W = 3200;
const WORLD_H = 540;
const GROUND_Y = 480;
const SCREEN_MARGIN = 16;
const CAMERA_LEAD = 0.4;
const START_X = 150;

const BULLET_LIFE_MS = 1000;
const BULLET_SIZE = 10;
const TARGET_SIZE = 40;
const TARGET_HP = 3;
const TARGET_RESPAWN_MS = 2000;
const FLASH_MS = 80;
const ZZZ_MS = 800;

/** 平台與天花板:左上角 (x, y) 與寬高。 */
const TERRAIN: ReadonlyArray<{ x: number; y: number; w: number; h: number }> = [
  { x: 0, y: GROUND_Y, w: WORLD_W, h: WORLD_H - GROUND_Y },
  { x: 600, y: 380, w: 200, h: 20 },
  { x: 1000, y: 300, w: 200, h: 20 },
  { x: 1700, y: 380, w: 240, h: 20 },
  // 低矮通道的天花板,底部 y=444,與地面間距 36。
  { x: 1300, y: 380, w: 200, h: 64 },
];

/** 練習靶:底部中央座標。 */
const TARGETS: ReadonlyArray<{ x: number; bottom: number }> = [
  { x: 450, bottom: GROUND_Y },
  { x: 900, bottom: GROUND_Y },
  { x: 2100, bottom: GROUND_Y },
  { x: 2300, bottom: GROUND_Y },
  { x: 2500, bottom: GROUND_Y },
  { x: 1100, bottom: 220 },
];

const COLOR = {
  terrain: 0x3b3366,
  player: 0xffd27a,
  bullet: 0xbfe6ff,
  target: 0xf3e9d2,
  flash: 0xffffff,
};

interface Target {
  rect: Phaser.GameObjects.Rectangle;
  hp: number;
}

interface Bullet {
  shape: Phaser.GameObjects.Arc;
  bornAt: number;
}

export interface TestRangeData {
  getTuning?: () => Tuning;
}

export class TestRangeScene extends Phaser.Scene {
  private getTuning: () => Tuning = () => DEFAULT_TUNING;
  private keyboard!: KeyboardSource;
  private terrain!: Phaser.Physics.Arcade.StaticGroup;
  private terrainBodies = new Set<Phaser.Physics.Arcade.StaticBody>();
  private body!: Phaser.GameObjects.Zone;
  private sprite!: Phaser.GameObjects.Rectangle;
  private motor: MotorState = initialMotorState();
  private fire: FireState = initialFireState();
  private bullets: Bullet[] = [];
  private bulletGroup!: Phaser.Physics.Arcade.Group;
  private targetGroup!: Phaser.Physics.Arcade.StaticGroup;
  private targets: Target[] = [];
  private targetsHit = 0;
  private scrollX = 0;

  constructor() {
    super('TestRange');
  }

  init(data: TestRangeData): void {
    if (data?.getTuning) this.getTuning = data.getTuning;
  }

  create(): void {
    this.motor = initialMotorState();
    this.fire = initialFireState();
    this.bullets = [];
    this.targets = [];
    this.targetsHit = 0;
    this.scrollX = 0;
    this.terrainBodies.clear();

    this.physics.world.setBounds(0, 0, WORLD_W, WORLD_H + 200);
    this.cameras.main.setBounds(0, 0, WORLD_W, WORLD_H);

    this.terrain = this.physics.add.staticGroup();
    for (const t of TERRAIN) {
      const r = this.add.rectangle(t.x + t.w / 2, t.y + t.h / 2, t.w, t.h, COLOR.terrain);
      this.terrain.add(r);
      this.terrainBodies.add(r.body as Phaser.Physics.Arcade.StaticBody);
    }

    this.targetGroup = this.physics.add.staticGroup();
    for (const t of TARGETS) {
      const rect = this.add.rectangle(t.x, t.bottom - TARGET_SIZE / 2, TARGET_SIZE, TARGET_SIZE, COLOR.target);
      this.targetGroup.add(rect);
      this.targets.push({ rect, hp: TARGET_HP });
    }

    this.body = this.add.zone(START_X, GROUND_Y - STAND_HITBOX.h / 2, STAND_HITBOX.w, STAND_HITBOX.h);
    this.physics.add.existing(this.body);
    this.playerBody().setCollideWorldBounds(false);
    this.sprite = this.add.rectangle(START_X, GROUND_Y, STAND_HITBOX.w, STAND_HITBOX.h, COLOR.player).setOrigin(0.5, 1);
    this.physics.add.collider(this.body, this.terrain);

    this.bulletGroup = this.physics.add.group({ allowGravity: false });
    this.physics.add.collider(this.bulletGroup, this.terrain, (b) => this.removeBullet(b as Phaser.GameObjects.Arc));
    this.physics.add.overlap(this.bulletGroup, this.targetGroup, (b, t) =>
      this.hitTarget(b as Phaser.GameObjects.Arc, t as Phaser.GameObjects.Rectangle),
    );

    this.add
      .text(16, 12, 'A D 移動  W 上  S 蹲/下  F 射擊  G 跳躍(方向鍵 , . 也可以)', {
        fontSize: '18px',
        color: '#f3e9d2',
      })
      .setScrollFactor(0)
      .setDepth(10);

    this.keyboard = new KeyboardSource(window, document);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.keyboard.destroy());

    window.__GK__ = { ready: true };
    this.publishDebug();
  }

  update(_time: number, delta: number): void {
    const t = this.getTuning();
    const dtMs = Math.min(delta, MAX_DT_MS);
    const keys = this.keyboard.pressed();
    const intent = mergeIntents(intentFromKeys(keys, PLAYER_A_KEYS), intentFromKeys(keys, PLAYER_B_KEYS));
    const pb = this.playerBody();
    const grounded = pb.blocked.down || pb.touching.down;
    const feetY = pb.bottom;

    const out = stepMotor(this.motor, { intent, grounded, canStand: this.canStand(pb.center.x, feetY), dtMs }, t);
    if (out.state.crouching !== this.motor.crouching) this.resizeBody(out.state.crouching, feetY);
    this.motor = out.state;

    pb.setGravityY(t.gravity);
    pb.setVelocity(out.vx, out.jumpVy ?? pb.velocity.y);

    const shot = stepFire(this.fire, intent.shoot, dtMs, t.fireIntervalMs);
    this.fire = shot.state;
    if (shot.fired) this.spawnBullet(t);
    this.expireBullets();

    this.scrollX = advanceCamera(this.scrollX, this.body.x, VIEW_W, WORLD_W, CAMERA_LEAD);
    this.cameras.main.scrollX = this.scrollX;
    const minX = minPlayerX(this.scrollX, SCREEN_MARGIN);
    const maxX = this.scrollX + VIEW_W - SCREEN_MARGIN;
    if (this.body.x < minX) this.body.x = minX;
    if (this.body.x > maxX) this.body.x = maxX;

    const h = this.motor.crouching ? CROUCH_HITBOX.h : STAND_HITBOX.h;
    this.sprite.setPosition(this.body.x, this.body.y + h / 2);
    this.sprite.setSize(STAND_HITBOX.w, h);
    this.sprite.setDisplaySize(STAND_HITBOX.w, h);

    this.publishDebug();
  }

  private playerBody(): Phaser.Physics.Arcade.Body {
    return this.body.body as Phaser.Physics.Arcade.Body;
  }

  /** 以站姿大小檢查頭上有沒有地形。 */
  private canStand(centerX: number, feetY: number): boolean {
    const hits = this.physics.overlapRect(
      centerX - STAND_HITBOX.w / 2,
      feetY - STAND_HITBOX.h,
      STAND_HITBOX.w,
      STAND_HITBOX.h - 1,
      false,
      true,
    );
    return !hits.some((b) => this.terrainBodies.has(b as Phaser.Physics.Arcade.StaticBody));
  }

  /** 切換判定範圍時保持腳底位置不變。 */
  private resizeBody(crouching: boolean, feetY: number): void {
    const box = crouching ? CROUCH_HITBOX : STAND_HITBOX;
    const pb = this.playerBody();
    const vy = pb.velocity.y;
    this.body.setSize(box.w, box.h);
    pb.setSize(box.w, box.h, true);
    pb.reset(this.body.x, feetY - box.h / 2);
    pb.velocity.y = vy;
  }

  private spawnBullet(t: Tuning): void {
    const m = this.motor;
    const off = muzzleOffset(m.aim, m.facing, m.crouching);
    const v = bulletVelocity(m.aim, m.facing, t.bulletSpeed);
    const feetY = this.playerBody().bottom;
    const shape = this.add.circle(this.body.x + off.x, feetY + off.y, BULLET_SIZE / 2, COLOR.bullet);
    this.bulletGroup.add(shape);
    (shape.body as Phaser.Physics.Arcade.Body).setVelocity(v.vx, v.vy);
    this.bullets.push({ shape, bornAt: this.time.now });
  }

  private expireBullets(): void {
    const now = this.time.now;
    for (const b of [...this.bullets]) {
      const outOfView = b.shape.x < this.scrollX - 50 || b.shape.x > this.scrollX + VIEW_W + 50;
      if (now - b.bornAt > BULLET_LIFE_MS || outOfView) this.removeBullet(b.shape);
    }
  }

  private removeBullet(shape: Phaser.GameObjects.Arc): void {
    this.bullets = this.bullets.filter((b) => b.shape !== shape);
    shape.destroy();
  }

  private hitTarget(shape: Phaser.GameObjects.Arc, rect: Phaser.GameObjects.Rectangle): void {
    const target = this.targets.find((t) => t.rect === rect);
    if (!target || target.hp <= 0) return;
    this.removeBullet(shape);
    this.targetsHit += 1;
    target.hp -= 1;

    rect.setFillStyle(COLOR.flash);
    this.time.delayedCall(FLASH_MS, () => rect.setFillStyle(COLOR.target));
    this.tweens.add({ targets: rect, scaleX: 1.2, scaleY: 0.8, duration: FLASH_MS, yoyo: true });

    if (target.hp === 0) this.defeatTarget(target);
  }

  private defeatTarget(target: Target): void {
    const t = this.getTuning();
    const { rect } = target;
    rect.setVisible(false);
    (rect.body as Phaser.Physics.Arcade.StaticBody).enable = false;

    const zzz = this.add.text(rect.x, rect.y - 10, 'Zzz', { fontSize: '22px', color: '#f3e9d2' }).setOrigin(0.5);
    this.tweens.add({ targets: zzz, y: zzz.y - 50, alpha: 0, duration: ZZZ_MS, onComplete: () => zzz.destroy() });

    if (t.hitStopMs > 0) {
      this.physics.world.pause();
      this.time.delayedCall(t.hitStopMs, () => this.physics.world.resume());
    }
    if (t.shakeMs > 0) this.cameras.main.shake(t.shakeMs, t.shakeIntensity);

    this.time.delayedCall(TARGET_RESPAWN_MS, () => {
      target.hp = TARGET_HP;
      rect.setVisible(true).setScale(1).setFillStyle(COLOR.target);
      (rect.body as Phaser.Physics.Arcade.StaticBody).enable = true;
    });
  }

  private publishDebug(): void {
    const pb = this.playerBody();
    window.__GK__ = {
      ready: true,
      player: {
        x: this.body.x,
        y: pb.bottom,
        crouching: this.motor.crouching,
        aim: this.motor.aim,
        facing: this.motor.facing,
      },
      bullets: this.bullets.length,
      targetsHit: this.targetsHit,
      cameraX: this.scrollX,
    };
  }
}
