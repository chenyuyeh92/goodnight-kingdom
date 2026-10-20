import Phaser from 'phaser';
import { DEFAULT_TUNING, MAX_DT_MS, type Tuning } from '../config/tuning';
import { KeyboardSource } from '../input/keyboardSource';
import { intentsForMode, type PlayMode } from '../input/playMode';
import { advanceCamera, minPlayerX } from '../game/camera';
import { PlayerEntity, type BulletSpawn } from '../game/playerEntity';

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
  mode?: PlayMode;
  checkpointX?: number;
  restarts?: number;
  testHooks?: boolean;
}

export class TestRangeScene extends Phaser.Scene {
  private getTuning: () => Tuning = () => DEFAULT_TUNING;
  private keyboard!: KeyboardSource;
  private terrain!: Phaser.Physics.Arcade.StaticGroup;
  private terrainBodies = new Set<Phaser.Physics.Arcade.StaticBody>();
  private players: PlayerEntity[] = [];
  private bullets: Bullet[] = [];
  private bulletGroup!: Phaser.Physics.Arcade.Group;
  private targetGroup!: Phaser.Physics.Arcade.StaticGroup;
  private targets: Target[] = [];
  private targetsHit = 0;
  private scrollX = 0;

  constructor() {
    super('TestRange');
  }

  private mode: PlayMode = 'single';

  init(data: TestRangeData): void {
    if (data?.getTuning) this.getTuning = data.getTuning;
    this.mode = data?.mode ?? 'single';
  }

  create(): void {
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

    const isTerrain = (b: unknown): boolean => this.terrainBodies.has(b as Phaser.Physics.Arcade.StaticBody);
    this.players = [new PlayerEntity(this, { x: START_X, feetY: GROUND_Y, color: COLOR.player, label: null, isTerrain })];
    for (const p of this.players) this.physics.add.collider(p.zone, this.terrain);

    this.bulletGroup = this.physics.add.group({ allowGravity: false });
    this.physics.add.collider(this.bulletGroup, this.terrain, (b) => this.removeBullet(b as Phaser.GameObjects.Arc));
    this.physics.add.overlap(this.bulletGroup, this.targetGroup, (b, t) =>
      this.hitTarget(b as Phaser.GameObjects.Arc, t as Phaser.GameObjects.Rectangle),
    );

    this.add
      .text(16, 12, 'A D 移動  W 上  S 蹲/下  C 射擊  V 跳躍(方向鍵 , . 也可以)', {
        fontSize: '18px',
        color: '#f3e9d2',
      })
      .setScrollFactor(0)
      .setDepth(10);

    this.keyboard = new KeyboardSource(window, document);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.keyboard.destroy());

    this.publishDebug();
  }

  update(time: number, delta: number): void {
    const t = this.getTuning();
    const dtMs = Math.min(delta, MAX_DT_MS);
    const intents = intentsForMode(this.keyboard.pressed(), this.mode);

    this.players.forEach((p, i) => {
      const shot = p.update(intents[i], dtMs, t);
      if (shot) this.spawnBullet(shot);
    });
    this.expireBullets();

    const lead = this.players[0];
    this.scrollX = advanceCamera(this.scrollX, lead.x, VIEW_W, WORLD_W, CAMERA_LEAD);
    this.cameras.main.scrollX = this.scrollX;
    for (const p of this.players) p.clampX(minPlayerX(this.scrollX, SCREEN_MARGIN), this.scrollX + VIEW_W - SCREEN_MARGIN);
    for (const p of this.players) p.render(time);

    this.publishDebug();
  }

  private spawnBullet(b: BulletSpawn): void {
    const shape = this.add.circle(b.x, b.y, BULLET_SIZE / 2, COLOR.bullet);
    this.bulletGroup.add(shape);
    (shape.body as Phaser.Physics.Arcade.Body).setVelocity(b.vx, b.vy);
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
    const players = this.players.map((p) => p.debug());
    window.__GK__ = {
      ready: true,
      screen: 'range',
      mode: this.mode,
      player: players[0],
      players,
      bullets: this.bullets.length,
      targetsHit: this.targetsHit,
      cameraX: this.scrollX,
    };
  }
}
