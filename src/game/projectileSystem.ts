import Phaser from 'phaser';
import type { Tuning } from '../config/tuning';
import type { BulletSpawn, PlayerEntity } from './playerEntity';
import { BOOMERANG_OUT_MS, HOMING_TURN_DEG_PER_SEC, boomerangVelocity, pelletVelocities, steerToward } from './projectileMath';
import type { WeaponDef } from './weapons';
import { bulletSprite } from '../art/sprites';

const OFF_VIEW_MARGIN = 50;
const BULLET_OUTLINE = 2;
/** 棉被迴力鏢飛行時的旋轉速度。 */
const SPIN_DEG_PER_MS = 0.9;
const BULLET_OUTLINE_COLOR = 0x3a2a5a;
/** 迴力鏢飛回主人身邊這麼近就收回。 */
const BOOMERANG_CATCH_DIST = 24;

export interface ProjectileHit {
  damage: number;
  vx: number;
  vy: number;
}

/** 命中處理的結果:consumed 一般命中、blocked 被刺盾擋下、ignored 不算(例如正在冒出的魔物)。 */
export type HitResult = 'consumed' | 'blocked' | 'ignored';

interface Projectile {
  shape: Phaser.GameObjects.Arc;
  /** 子彈圖,跟著判定移動並朝飛行方向轉;沒有圖時為 null,顯示描邊圓點。 */
  art: Phaser.GameObjects.Image | null;
  owner: PlayerEntity;
  def: WeaponDef;
  bornAt: number;
  initial: { vx: number; vy: number };
  hits: Set<unknown>;
  /** 迴力鏢去程被刺盾擋過的目標;回程才能再打。 */
  blockedOut: Set<unknown>;
}

const PIERCING = new Set(['pierce', 'boomerang', 'beam']);
const THROUGH_TERRAIN = new Set(['boomerang', 'beam']);

/** 所有玩家子彈:生成、軌跡、碰撞與壽命。 */
export class ProjectileSystem {
  private readonly group: Phaser.Physics.Arcade.Group;
  private projectiles: Projectile[] = [];

  constructor(
    private readonly scene: Phaser.Scene,
    terrain: Phaser.Physics.Arcade.StaticGroup,
    private readonly onHit: (target: Phaser.GameObjects.GameObject, hit: ProjectileHit) => HitResult,
  ) {
    this.group = scene.physics.add.group({ allowGravity: false });
    scene.physics.add.overlap(this.group, terrain, (b) => {
      const p = this.find(b);
      if (p && !THROUGH_TERRAIN.has(p.def.kind)) this.remove(p);
    });
  }

  /** 讓子彈可以打到這一組目標。 */
  addTargets(targets: Phaser.Physics.Arcade.Group | Phaser.Physics.Arcade.StaticGroup): void {
    this.scene.physics.add.overlap(this.group, targets, (b, t) => this.handleHit(b, t as Phaser.GameObjects.GameObject));
  }

  fire(owner: PlayerEntity, def: WeaponDef, spawn: BulletSpawn, t: Tuning): void {
    const speed = def.speed ?? t.bulletSpeed;
    const len = Math.hypot(spawn.vx, spawn.vy) || 1;
    const dir = { vx: (spawn.vx / len) * speed, vy: (spawn.vy / len) * speed };
    const velocities =
      def.kind === 'spread' && def.pellets
        ? pelletVelocities(owner.motor.aim, owner.motor.facing, speed, def.pellets, def.spreadDeg ?? 0)
        : [dir];
    for (const v of velocities) {
      // 深紫外框讓子彈在亮色天空與深色樹林前都看得清楚。
      const shape = this.scene.add.circle(spawn.x, spawn.y, def.size / 2 + 1, def.color).setStrokeStyle(BULLET_OUTLINE, BULLET_OUTLINE_COLOR).setDepth(4);
      this.group.add(shape);
      (shape.body as Phaser.Physics.Arcade.Body).setVelocity(v.vx, v.vy);
      const art = this.makeArt(def, spawn.x, spawn.y);
      if (art) shape.setVisible(false);
      const p: Projectile = { shape, art, owner, def, bornAt: this.scene.time.now, initial: v, hits: new Set(), blockedOut: new Set() };
      this.projectiles.push(p);
      this.renderArt(p);
    }
  }

  update(dtMs: number, scrollX: number, viewW: number, homingTargets: () => { x: number; y: number }[]): void {
    const now = this.scene.time.now;
    for (const p of [...this.projectiles]) {
      const age = now - p.bornAt;
      const body = p.shape.body as Phaser.Physics.Arcade.Body;
      if (age > p.def.lifeMs) {
        this.remove(p);
        continue;
      }
      if (p.def.kind === 'boomerang') {
        const owner = p.owner.health.down ? null : { x: p.owner.x, y: p.owner.feetY - 24 };
        if (owner && age >= BOOMERANG_OUT_MS && Math.hypot(owner.x - p.shape.x, owner.y - p.shape.y) < BOOMERANG_CATCH_DIST) {
          this.remove(p);
          continue;
        }
        const v = boomerangVelocity(age, p.initial, { x: p.shape.x, y: p.shape.y }, owner);
        body.setVelocity(v.vx, v.vy);
        continue;
      }
      if (p.shape.x < scrollX - OFF_VIEW_MARGIN || p.shape.x > scrollX + viewW + OFF_VIEW_MARGIN) {
        this.remove(p);
        continue;
      }
      if (p.def.kind === 'homing') {
        const targets = homingTargets();
        if (targets.length > 0) {
          const nearest = targets.reduce((a, b) =>
            Math.hypot(a.x - p.shape.x, a.y - p.shape.y) <= Math.hypot(b.x - p.shape.x, b.y - p.shape.y) ? a : b,
          );
          const v = steerToward(body.velocity.x, body.velocity.y, p.shape.x, p.shape.y, nearest.x, nearest.y, HOMING_TURN_DEG_PER_SEC, dtMs);
          body.setVelocity(v.vx, v.vy);
        }
      }
    }
  }

  count(): number {
    return this.projectiles.length;
  }

  /** 物理移動完後呼叫:把子彈圖對到判定上。 */
  renderAll(): void {
    for (const p of this.projectiles) this.renderArt(p);
  }

  private makeArt(def: WeaponDef, x: number, y: number): Phaser.GameObjects.Image | null {
    const key = bulletSprite(def.id);
    if (!this.scene.textures.exists(key)) return null;
    const img = this.scene.add.image(x, y, key).setDepth(4);
    // 小子彈放大到至少「判定 + 6」看得清楚;大的照原尺寸。
    const want = def.size + 6;
    const big = Math.max(img.width, img.height);
    if (big < want) img.setScale(want / big);
    return img;
  }

  private renderArt(p: Projectile): void {
    if (!p.art) return;
    const body = p.shape.body as Phaser.Physics.Arcade.Body;
    p.art.setPosition(p.shape.x, p.shape.y);
    if (p.def.kind === 'boomerang') p.art.setAngle((this.scene.time.now - p.bornAt) * SPIN_DEG_PER_MS);
    else if (body.velocity.lengthSq() > 0) p.art.setRotation(Math.atan2(body.velocity.y, body.velocity.x));
  }

  clear(): void {
    for (const p of [...this.projectiles]) this.remove(p);
  }

  private handleHit(b: unknown, target: Phaser.GameObjects.GameObject): void {
    const p = this.find(b);
    if (!p || p.hits.has(target)) return;
    const boomerang = p.def.kind === 'boomerang';
    const returning = this.scene.time.now - p.bornAt >= BOOMERANG_OUT_MS;
    if (boomerang && p.blockedOut.has(target) && !returning) return;
    const v = (p.shape.body as Phaser.Physics.Arcade.Body).velocity;
    const result = this.onHit(target, { damage: p.def.damage, vx: v.x, vy: v.y });
    if (result === 'ignored') return;
    if (result === 'blocked' && boomerang) {
      // 迴力鏢被正面擋下時不消失,繼續飛,回程打背後。
      p.blockedOut.add(target);
      return;
    }
    p.hits.add(target);
    if (result === 'blocked' || !PIERCING.has(p.def.kind)) this.remove(p);
  }

  private find(obj: unknown): Projectile | undefined {
    return this.projectiles.find((p) => p.shape === obj);
  }

  private remove(p: Projectile): void {
    this.projectiles = this.projectiles.filter((q) => q !== p);
    p.shape.destroy();
    p.art?.destroy();
  }
}
