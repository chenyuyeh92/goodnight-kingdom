import Phaser from 'phaser';
import { DEFAULT_TUNING, MAX_DT_MS, type Tuning } from '../config/tuning';
import { KeyboardSource } from '../input/keyboardSource';
import { controlHint, intentsForMode, type PlayMode } from '../input/playMode';
import { advanceTeamCamera, applyLock, limitCameraStep, minPlayerX } from '../game/camera';
import { PlayerEntity, type BulletSpawn } from '../game/playerEntity';
import { MAX_HEARTS, REVIVE_INVULN_MS, applyHit, freshHealth, tickHealth } from '../game/health';
import { decideTeam, reachedCheckpoint } from '../game/team';
import { ENEMY_DEFS, bulletEffect, type EnemyType } from '../game/enemies';
import { EnemyEntity } from '../game/enemyEntity';
import {
  initialEncounters,
  stepEncounters,
  type ArenaDef,
  type EncounterState,
  type SpawnSpec,
  type TrickleDef,
} from '../game/encounters';

const VIEW_W = 960;
const WORLD_W = 3200;
const WORLD_H = 540;
const GROUND_Y = 480;
const SCREEN_MARGIN = 16;
const CAMERA_LEAD = 0.4;
const START_X = 150;
const PARTNER_OFFSET_X = 40;
/** 鏡頭最快是角色速度的 1.5 倍,平常跟得上,隊友睡著時不會瞬間跳動。 */
const CAMERA_MAX_SPEED_RATIO = 1.5;

const BULLET_LIFE_MS = 1000;
const BULLET_SIZE = 10;
const TARGET_SIZE = 40;
const TARGET_HP = 3;
const TARGET_RESPAWN_MS = 2000;
const FLASH_MS = 80;
const ZZZ_MS = 800;
/** 落在鏡頭左邊這麼遠的魔物直接移除。 */
const ENEMY_DESPAWN_BEHIND = 200;
const FLYING_SPAWN_Y = 320;
const SIDE_SPAWN_MARGIN = 20;
const TOP_SPAWN_Y = -30;
const EMERGE_MS = 300;
const GO_HINT_MS = 1500;

/** 移動途中零星出現的魔物。 */
const TRICKLES: readonly TrickleDef[] = [
  { triggerScrollX: 300, spawn: { type: 'alarmBug', from: 'right', delayMs: 0 } },
  { triggerScrollX: 700, spawn: { type: 'nightBat', from: 'right', delayMs: 0 } },
];

/** 戰鬥區:鏡頭鎖住,魔物一波波從各方向出現,清完才解鎖。 */
const ARENAS: readonly ArenaDef[] = [
  {
    lockScrollX: 1500,
    waves: [
      [
        { type: 'alarmBug', from: 'right', delayMs: 0 },
        { type: 'alarmBug', from: 'right', delayMs: 500 },
        { type: 'alarmBug', from: 'right', delayMs: 1000 },
      ],
      [
        { type: 'nightBat', from: 'left', delayMs: 0 },
        { type: 'nightBat', from: 'right', delayMs: 300 },
        { type: 'coffeeBean', from: 'top', x: 1980, delayMs: 600 },
      ],
      [
        { type: 'hedgehog', from: 'right', delayMs: 0 },
        { type: 'coffeeBean', from: 'ground', x: 1700, delayMs: 800 },
      ],
    ],
  },
  {
    lockScrollX: 2240,
    waves: [
      [
        { type: 'coffeeBean', from: 'ground', x: 2600, delayMs: 0 },
        { type: 'coffeeBean', from: 'ground', x: 2850, delayMs: 400 },
        { type: 'alarmBug', from: 'left', delayMs: 800 },
      ],
    ],
  },
];

/** 平台與天花板:左上角 (x, y) 與寬高。 */
const TERRAIN: ReadonlyArray<{ x: number; y: number; w: number; h: number }> = [
  { x: 0, y: GROUND_Y, w: WORLD_W, h: WORLD_H - GROUND_Y },
  { x: 600, y: 380, w: 200, h: 20 },
  { x: 1000, y: 300, w: 200, h: 20 },
  { x: 1700, y: 380, w: 240, h: 20 },
  // 低矮通道的天花板,底部 y=444,與地面間距 36。
  { x: 1300, y: 380, w: 200, h: 64 },
];

/** 荊棘:x 起點與寬度,貼在地面上;都不在平台正下方,跳過時不會撞頭。 */
const THORNS: ReadonlyArray<{ x: number; w: number }> = [
  { x: 520, w: 60 },
  { x: 1580, w: 60 },
  { x: 2380, w: 80 },
];
const THORN_H = 16;
const THORN_BOUNCE_VY = -350;

const CHECKPOINTS: readonly number[] = [150, 1200, 2000];
/** 復活時從畫面頂端掉下來,隊友在通道裡也不會卡進地形。 */
const REVIVE_DROP_Y = 40;

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
  playerA: 0xffd27a,
  playerB: 0x9be7c4,
  bullet: 0xbfe6ff,
  target: 0xf3e9d2,
  flash: 0xffffff,
  thorn: 0x7a4a8c,
  dirt: 0x6b4f3a,
  checkpoint: 0x4b4380,
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
  private enemies: EnemyEntity[] = [];
  private enemyGroup!: Phaser.Physics.Arcade.Group;
  private enemiesDefeated = 0;
  private blockedShots = 0;
  private encounters: EncounterState = initialEncounters();
  private lockScrollX: number | null = null;
  private arenaHud!: Phaser.GameObjects.Text;
  private goHintUntil = 0;
  private scrollX = 0;

  constructor() {
    super('TestRange');
  }

  private mode: PlayMode = 'single';
  private checkpointX = START_X;
  private restarts = 0;
  private testHooks = false;
  private initData: TestRangeData = {};
  private maxReachedX = START_X;
  private restarting = false;
  private hud!: Phaser.GameObjects.Text;

  init(data: TestRangeData): void {
    this.initData = data ?? {};
    if (data?.getTuning) this.getTuning = data.getTuning;
    this.mode = data?.mode ?? 'single';
    this.checkpointX = data?.checkpointX ?? START_X;
    this.restarts = data?.restarts ?? 0;
    this.testHooks = data?.testHooks ?? false;
  }

  create(): void {
    this.bullets = [];
    this.targets = [];
    this.enemies = [];
    this.enemiesDefeated = 0;
    this.blockedShots = 0;
    this.encounters = initialEncounters();
    this.lockScrollX = null;
    this.goHintUntil = 0;
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
    const startX = this.checkpointX;
    this.players =
      this.mode === 'duo'
        ? [
            new PlayerEntity(this, { x: startX, feetY: GROUND_Y, color: COLOR.playerA, label: 'A', isTerrain }),
            new PlayerEntity(this, { x: startX + PARTNER_OFFSET_X, feetY: GROUND_Y, color: COLOR.playerB, label: 'B', isTerrain }),
          ]
        : [new PlayerEntity(this, { x: startX, feetY: GROUND_Y, color: COLOR.playerA, label: null, isTerrain })];
    this.scrollX = Math.min(Math.max(startX - VIEW_W * CAMERA_LEAD, 0), WORLD_W - VIEW_W);
    this.encounters = initialEncounters(this.scrollX, TRICKLES);
    for (const p of this.players) this.physics.add.collider(p.zone, this.terrain);
    this.maxReachedX = startX;
    this.restarting = false;

    for (const cp of CHECKPOINTS) this.add.rectangle(cp, GROUND_Y - 30, 4, 60, COLOR.checkpoint).setDepth(-1);
    const thorns = this.physics.add.staticGroup();
    for (const t of THORNS) thorns.add(this.add.rectangle(t.x + t.w / 2, GROUND_Y - THORN_H / 2, t.w, THORN_H, COLOR.thorn));
    for (const p of this.players) this.physics.add.overlap(p.zone, thorns, () => this.hurtPlayer(p, true));

    this.enemyGroup = this.physics.add.group();
    this.physics.add.collider(this.enemyGroup, this.terrain);
    // 正在從地面冒出的魔物還看不見,不傷人也不會被打到。
    const solid = (_a: unknown, e: unknown): boolean => !this.enemyFor(e)?.emerging;
    for (const p of this.players) {
      this.physics.add.overlap(p.zone, this.enemyGroup, () => this.hurtPlayer(p, true), solid);
    }

    this.bulletGroup = this.physics.add.group({ allowGravity: false });
    this.physics.add.overlap(
      this.bulletGroup,
      this.enemyGroup,
      (b, e) => this.hitEnemy(b as Phaser.GameObjects.Arc, e as Phaser.GameObjects.Rectangle),
      solid,
    );
    this.physics.add.collider(this.bulletGroup, this.terrain, (b) => this.removeBullet(b as Phaser.GameObjects.Arc));
    this.physics.add.overlap(this.bulletGroup, this.targetGroup, (b, t) =>
      this.hitTarget(b as Phaser.GameObjects.Arc, t as Phaser.GameObjects.Rectangle),
    );

    this.add
      .text(16, 12, controlHint(this.mode), {
        fontSize: this.mode === 'duo' ? '15px' : '18px',
        color: '#f3e9d2',
      })
      .setScrollFactor(0)
      .setDepth(10);
    this.hud = this.add.text(16, 40, '', { fontSize: '20px', color: '#ffb3c7' }).setScrollFactor(0).setDepth(10);
    this.arenaHud = this.add
      .text(VIEW_W / 2, 90, '', { fontSize: '26px', color: '#ffe08a' })
      .setOrigin(0.5)
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
      p.health = tickHealth(p.health, dtMs);
      const shot = p.update(intents[i], dtMs, t);
      if (shot) this.spawnBullet(shot);
    });
    this.expireBullets();
    this.updateEnemies(dtMs, t);
    this.handleTeam();

    const awake = this.players.filter((p) => !p.health.down);
    this.updateEncounters(dtMs, time);
    const target = applyLock(
      advanceTeamCamera(this.scrollX, awake.map((p) => p.x), VIEW_W, WORLD_W, CAMERA_LEAD, SCREEN_MARGIN),
      this.lockScrollX,
    );
    const maxStep = (Math.max(t.walkSpeed, t.airSpeed) * CAMERA_MAX_SPEED_RATIO * dtMs) / 1000;
    this.scrollX = limitCameraStep(this.scrollX, target, maxStep);
    this.cameras.main.scrollX = this.scrollX;
    for (const p of awake) p.clampX(minPlayerX(this.scrollX, SCREEN_MARGIN), this.scrollX + VIEW_W - SCREEN_MARGIN);
    for (const p of awake) this.maxReachedX = Math.max(this.maxReachedX, p.x);
    for (const p of this.players) p.render(time);
    this.renderHud();

    this.publishDebug();
  }

  /** 無敵或睡著時不會受傷;碰到荊棘時小彈跳一下。 */
  private hurtPlayer(p: PlayerEntity, bounce: boolean): void {
    const r = applyHit(p.health);
    p.health = r.health;
    if (r.hit && bounce && !r.health.down) p.body().setVelocityY(THORN_BOUNCE_VY);
  }

  private handleTeam(): void {
    if (this.restarting) return;
    const action = decideTeam(this.players.map((p) => p.health));
    if (action.kind === 'revive') {
      const p = this.players[action.index];
      const partner = this.players.find((q) => !q.health.down)!;
      p.teleport(partner.x, REVIVE_DROP_Y);
      p.health = freshHealth(REVIVE_INVULN_MS);
    } else if (action.kind === 'restart') {
      this.restarting = true;
      this.scene.restart({
        ...this.initData,
        checkpointX: reachedCheckpoint(CHECKPOINTS, this.maxReachedX),
        restarts: this.restarts + 1,
      });
    }
  }

  private renderHud(): void {
    const labels = this.mode === 'duo' ? ['A', 'B'] : [''];
    this.hud.setText(
      this.players
        .map((p, i) => {
          const name = labels[i] ? `${labels[i]} ` : '';
          if (p.health.down) return `${name}睡著了…`;
          return name + '♥'.repeat(p.health.hearts) + '♡'.repeat(MAX_HEARTS - p.health.hearts);
        })
        .join('    '),
    );
  }

  spawnEnemy(type: EnemyType, x: number, y?: number, arena = false): EnemyEntity {
    const def = ENEMY_DEFS[type];
    const feetY = y !== undefined ? y + def.h / 2 : def.flying ? FLYING_SPAWN_Y + def.h / 2 : GROUND_Y;
    const enemy = new EnemyEntity(this, type, x, feetY, arena);
    this.enemyGroup.add(enemy.body);
    enemy.physicsBody().setAllowGravity(!def.flying);
    this.enemies.push(enemy);
    return enemy;
  }

  private updateEncounters(dtMs: number, time: number): void {
    const wasLocked = this.lockScrollX !== null;
    const step = stepEncounters(this.encounters, ARENAS, TRICKLES, {
      scrollX: this.scrollX,
      arenaEnemiesAlive: this.enemies.filter((e) => e.arena).length,
      dtMs,
    });
    this.encounters = step.state;
    this.lockScrollX = step.lockScrollX;
    for (const s of step.spawns) this.spawnFrom(s.spec, s.arena);
    if (wasLocked && this.lockScrollX === null) this.goHintUntil = time + GO_HINT_MS;

    const active = this.encounters.active;
    if (active) {
      const total = ARENAS[this.encounters.nextArena].waves.length;
      this.arenaHud.setText(`清除魔物!(第 ${active.wave + 1} / ${total} 波)`);
    } else {
      this.arenaHud.setText(time < this.goHintUntil ? '前進 →' : '');
    }
  }

  /** 依進場方式決定生成位置:左右從畫面外、上方掉落、地面冒出。 */
  private spawnFrom(spec: SpawnSpec, arena: boolean): void {
    const def = ENEMY_DEFS[spec.type];
    if (spec.from === 'left' || spec.from === 'right') {
      const x = spec.from === 'left' ? this.scrollX - SIDE_SPAWN_MARGIN : this.scrollX + VIEW_W + SIDE_SPAWN_MARGIN;
      this.spawnEnemy(spec.type, x, undefined, arena);
      return;
    }
    const x = spec.x ?? this.scrollX + VIEW_W / 2;
    if (spec.from === 'top') {
      this.spawnEnemy(spec.type, x, TOP_SPAWN_Y, arena);
      return;
    }
    const enemy = this.spawnEnemy(spec.type, x, def.flying ? undefined : GROUND_Y - def.h / 2, arena);
    enemy.emerging = true;
    enemy.body.setAlpha(0);
    this.tweens.add({ targets: enemy.body, alpha: 1, duration: EMERGE_MS, onComplete: () => (enemy.emerging = false) });
    const mound = this.add.ellipse(x, GROUND_Y, def.w + 16, 12, COLOR.dirt);
    this.tweens.add({ targets: mound, alpha: 0, delay: EMERGE_MS, duration: EMERGE_MS, onComplete: () => mound.destroy() });
  }

  /** 測試用:把醒著的角色與鏡頭一起移到 x。 */
  private warp(x: number): void {
    this.players.forEach((p, i) => {
      if (!p.health.down) p.teleport(x + i * PARTNER_OFFSET_X, GROUND_Y);
    });
    this.scrollX = Math.min(Math.max(x - VIEW_W * CAMERA_LEAD, this.scrollX), WORLD_W - VIEW_W);
    this.maxReachedX = Math.max(this.maxReachedX, x);
  }

  private updateEnemies(dtMs: number, t: Tuning): void {
    const awake = this.players.filter((p) => !p.health.down);
    for (const e of [...this.enemies]) {
      if (e.x < this.scrollX - ENEMY_DESPAWN_BEHIND) {
        this.removeEnemy(e);
        continue;
      }
      const nearest = awake.reduce<PlayerEntity | null>(
        (best, p) => (best === null || Math.abs(p.x - e.x) < Math.abs(best.x - e.x) ? p : best),
        null,
      );
      e.update(nearest ? nearest.x : null, dtMs, t.gravity);
      e.render();
    }
  }

  private enemyFor(obj: unknown): EnemyEntity | undefined {
    return this.enemies.find((e) => e.body === obj);
  }

  private hitEnemy(shape: Phaser.GameObjects.Arc, rect: Phaser.GameObjects.Rectangle): void {
    const enemy = this.enemies.find((e) => e.body === rect);
    if (!enemy || enemy.hp <= 0) return;
    const v = (shape.body as Phaser.Physics.Arcade.Body).velocity;
    this.removeBullet(shape);
    if (bulletEffect(enemy.def, enemy.brain.facing, v.x, v.y) === 'blocked') {
      this.blockedShots += 1;
      return;
    }
    enemy.hp -= 1;
    enemy.flash();
    if (enemy.hp === 0) this.defeatEnemy(enemy);
  }

  private defeatEnemy(enemy: EnemyEntity): void {
    this.enemiesDefeated += 1;
    this.playDefeatEffect(enemy.body.x, enemy.body.y);
    this.removeEnemy(enemy);
  }

  private removeEnemy(enemy: EnemyEntity): void {
    this.enemies = this.enemies.filter((e) => e !== enemy);
    enemy.destroy();
  }

  /** 打倒時的回饋:Zzz 飄走、短暫停頓、輕微晃動。 */
  private playDefeatEffect(x: number, y: number): void {
    const t = this.getTuning();
    const zzz = this.add.text(x, y - 10, 'Zzz', { fontSize: '22px', color: '#f3e9d2' }).setOrigin(0.5);
    this.tweens.add({ targets: zzz, y: zzz.y - 50, alpha: 0, duration: ZZZ_MS, onComplete: () => zzz.destroy() });
    if (t.hitStopMs > 0) {
      this.physics.world.pause();
      this.time.delayedCall(t.hitStopMs, () => this.physics.world.resume());
    }
    if (t.shakeMs > 0) this.cameras.main.shake(t.shakeMs, t.shakeIntensity);
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
    const { rect } = target;
    rect.setVisible(false);
    (rect.body as Phaser.Physics.Arcade.StaticBody).enable = false;
    this.playDefeatEffect(rect.x, rect.y);

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
      checkpointX: this.checkpointX,
      restarts: this.restarts,
      hurt: this.testHooks ? (i: number) => this.hurtPlayer(this.players[i], false) : undefined,
      spawn: this.testHooks ? (type: EnemyType, x: number, y?: number) => void this.spawnEnemy(type, x, y) : undefined,
      defeatAll: this.testHooks ? () => [...this.enemies].forEach((e) => this.defeatEnemy(e)) : undefined,
      warp: this.testHooks ? (x: number) => this.warp(x) : undefined,
      spawnGround: this.testHooks
        ? (type: EnemyType, x: number) => this.spawnFrom({ type, from: 'ground', x, delayMs: 0 }, false)
        : undefined,
      arena: {
        locked: this.lockScrollX !== null,
        wave: this.encounters.active?.wave ?? 0,
        nextArena: this.encounters.nextArena,
      },
      enemies: this.enemies.map((e) => e.debug()),
      enemiesDefeated: this.enemiesDefeated,
      blockedShots: this.blockedShots,
      bullets: this.bullets.length,
      targetsHit: this.targetsHit,
      cameraX: this.scrollX,
    };
  }
}
