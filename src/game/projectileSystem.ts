import Phaser from 'phaser';
import type { Tuning } from '../config/tuning';
import type { BulletSpawn, PlayerEntity } from './playerEntity';
import { MAX_DT_MS } from '../config/tuning';
import { BOOMERANG_OUT_MS, HOMING_TURN_DEG_PER_SEC, bounceOff, boomerangVelocity, chargeDamage, chargeScale, meteorTargetX, pelletVelocities, steerToward } from './projectileMath';
import type { WeaponDef } from './weapons';
import { bulletSprite } from '../art/sprites';

const OFF_VIEW_MARGIN = 50;
const BULLET_OUTLINE = 2;
/** 棉被迴力鏢飛行時的旋轉速度。 */
const SPIN_DEG_PER_MS = 0.9;
const BULLET_OUTLINE_COLOR = 0x3a2a5a;
/** 迴力鏢飛回主人身邊這麼近就收回。 */
const BOOMERANG_CATCH_DIST = 24;
/** 毛線球、棉花糖丟出去時往上抬一點(方向向量加上這麼多往上)。 */
const LOB_LIFT: Partial<Record<string, number>> = { bounce: 0.35, lob: 0.7 };
/** 毛線球彈起來至少這麼快(打到魔物也往上彈)。 */
const MIN_BOUNCE_VY = 260;
/** 流星從畫面上方外面、落點後方這麼遠的地方出來,斜斜落到落點。 */
const METEOR_START_Y = -40;
const METEOR_BACK = 120;
/** 流星的圖是往下掉的(星星在下),轉到飛行方向要少轉 90 度。 */
const METEOR_ART_DEG = -90;

export interface ProjectileHit {
  damage: number;
  vx: number;
  vy: number;
  /** 打到時子彈的位置與顏色(噴火花用)。 */
  x: number;
  y: number;
  color: number;
}

/** 命中處理的結果:consumed 一般命中、blocked 被刺盾擋下、ignored 不算(例如正在冒出的魔物)。 */
export type HitResult = 'consumed' | 'blocked' | 'ignored';

/** 棉花糖、流星爆開:半徑內全部受傷(刺盾擋不住)。 */
export interface Blast {
  x: number;
  y: number;
  radius: number;
  damage: number;
  color: number;
}

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
  /** 這一發的傷害(懷錶依集氣決定)。 */
  damage: number;
  /** 毛線球還能彈幾次。 */
  bouncesLeft: number;
}

const PIERCING = new Set(['pierce', 'boomerang', 'beam', 'charge']);
const THROUGH_TERRAIN = new Set(['boomerang', 'beam', 'charge']);
const EXPLODES = new Set(['lob', 'meteor']);

/** 所有玩家子彈:生成、軌跡、碰撞與壽命。 */
export class ProjectileSystem {
  private readonly group: Phaser.Physics.Arcade.Group;
  private projectiles: Projectile[] = [];

  constructor(
    private readonly scene: Phaser.Scene,
    terrain: Phaser.Physics.Arcade.StaticGroup,
    private readonly onHit: (target: Phaser.GameObjects.GameObject, hit: ProjectileHit) => HitResult,
    private readonly onBlast: (blast: Blast) => void = () => {},
  ) {
    this.group = scene.physics.add.group({ allowGravity: false });
    scene.physics.add.overlap(this.group, terrain, (b, t) => {
      const p = this.find(b);
      if (!p || THROUGH_TERRAIN.has(p.def.kind)) return;
      if (p.def.kind === 'bounce') this.bounceOnTerrain(p, t as Phaser.GameObjects.GameObject);
      else if (EXPLODES.has(p.def.kind)) this.explode(p);
      else this.remove(p);
    });
  }

  /** 讓子彈可以打到這一組目標。 */
  addTargets(targets: Phaser.Physics.Arcade.Group | Phaser.Physics.Arcade.StaticGroup): void {
    this.scene.physics.add.overlap(this.group, targets, (b, t) => this.handleHit(b, t as Phaser.GameObjects.GameObject));
  }

  fire(owner: PlayerEntity, def: WeaponDef, spawn: BulletSpawn, t: Tuning, rng: () => number = Math.random): void {
    const speed = def.speed ?? t.bulletSpeed;
    let from = { x: spawn.x, y: spawn.y };
    let dx = spawn.vx;
    let dy = spawn.vy;
    if (def.kind === 'meteor') {
      // 流星:落點在前方 160–360,從畫面上方、落點後方斜斜掉下來。
      const tx = meteorTargetX(owner.x, owner.motor.facing, rng);
      from = { x: tx - owner.motor.facing * METEOR_BACK, y: METEOR_START_Y };
      dx = tx - from.x;
      dy = owner.feetY - from.y;
    } else if (LOB_LIFT[def.kind] !== undefined) {
      const l = Math.hypot(dx, dy) || 1;
      dx /= l;
      dy = dy / l - (LOB_LIFT[def.kind] ?? 0);
    }
    const len = Math.hypot(dx, dy) || 1;
    const dir = { vx: (dx / len) * speed, vy: (dy / len) * speed };
    const velocities =
      def.kind === 'spread' && def.pellets
        ? pelletVelocities(owner.motor.aim, owner.motor.facing, speed, def.pellets, def.spreadDeg ?? 0)
        : [dir];
    const chargeMs = def.kind === 'charge' ? (spawn.chargeMs ?? 0) : 0;
    const damage = def.charge ? chargeDamage(chargeMs, def.damage, def.charge.maxDamage, def.charge.maxMs) : def.damage;
    const scale = def.charge ? chargeScale(chargeMs, def.charge.maxMs) : 1;
    for (const v of velocities) {
      // 深紫外框讓子彈在亮色天空與深色樹林前都看得清楚。
      const r = (def.size * scale) / 2 + 1;
      const shape = this.scene.add.circle(from.x, from.y, r, def.color).setStrokeStyle(BULLET_OUTLINE, BULLET_OUTLINE_COLOR).setDepth(4);
      this.group.add(shape);
      (shape.body as Phaser.Physics.Arcade.Body).setVelocity(v.vx, v.vy);
      const art = this.makeArt(def, from.x, from.y, scale);
      if (art) shape.setVisible(false);
      const p: Projectile = {
        shape, art, owner, def, bornAt: this.scene.time.now, initial: v, hits: new Set(), blockedOut: new Set(),
        damage: Math.round(damage), bouncesLeft: def.bounces ?? 0,
      };
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
      if (p.def.gravity) body.setVelocityY(body.velocity.y + (p.def.gravity * Math.min(dtMs, MAX_DT_MS)) / 1000);
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

  /** 測試用:場上每一發子彈的武器、位置、傷害、還能彈幾次。 */
  debug(): { id: string; x: number; y: number; damage: number; bouncesLeft: number; size: number }[] {
    return this.projectiles.map((p) => ({
      id: p.def.id,
      x: p.shape.x,
      y: p.shape.y,
      damage: p.damage,
      bouncesLeft: p.bouncesLeft,
      size: p.shape.radius * 2,
    }));
  }

  /** 物理移動完後呼叫:把子彈圖對到判定上。 */
  renderAll(): void {
    for (const p of this.projectiles) this.renderArt(p);
  }

  private makeArt(def: WeaponDef, x: number, y: number, scale = 1): Phaser.GameObjects.Image | null {
    const key = bulletSprite(def.id);
    if (!this.scene.textures.exists(key)) return null;
    const img = this.scene.add.image(x, y, key).setDepth(4);
    // 小子彈放大到至少「判定 + 6」看得清楚;大的照原尺寸。懷錶的波集越久越大。
    const want = def.size + 6;
    const big = Math.max(img.width, img.height);
    img.setScale((big < want ? want / big : 1) * scale);
    return img;
  }

  private renderArt(p: Projectile): void {
    if (!p.art) return;
    const body = p.shape.body as Phaser.Physics.Arcade.Body;
    p.art.setPosition(p.shape.x, p.shape.y);
    if (p.def.kind === 'boomerang' || p.def.kind === 'bounce') p.art.setAngle((this.scene.time.now - p.bornAt) * SPIN_DEG_PER_MS);
    else if (body.velocity.lengthSq() > 0) {
      p.art.setRotation(Math.atan2(body.velocity.y, body.velocity.x));
      if (p.def.kind === 'meteor') p.art.setAngle(p.art.angle + METEOR_ART_DEG);
    }
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
    const body = p.shape.body as Phaser.Physics.Arcade.Body;
    const v = body.velocity;
    const result = EXPLODES.has(p.def.kind)
      ? 'consumed'
      : this.onHit(target, { damage: p.damage, vx: v.x, vy: v.y, x: p.shape.x, y: p.shape.y, color: p.def.color });
    if (result === 'ignored') return;
    if (EXPLODES.has(p.def.kind)) {
      this.explode(p);
      return;
    }
    if (p.def.kind === 'bounce') {
      // 毛線球打到魔物往上彈(被刺盾擋下往回彈),算一次彈跳。
      p.hits.add(target);
      const out = result === 'blocked' ? bounceOff({ vx: v.x, vy: v.y }, 'wall') : { vx: v.x, vy: -Math.max(MIN_BOUNCE_VY, Math.abs(v.y)) };
      body.setVelocity(out.vx, out.vy);
      this.spendBounce(p);
      return;
    }
    if (result === 'blocked' && boomerang) {
      // 迴力鏢被正面擋下時不消失,繼續飛,回程打背後;回程又被擋下就不再碰這隻(不會每一格都磨盾牌)。
      if (returning) p.hits.add(target);
      else p.blockedOut.add(target);
      return;
    }
    p.hits.add(target);
    if (result === 'blocked' || !PIERCING.has(p.def.kind)) this.remove(p);
  }

  /** 毛線球碰到地形:從上面掉下來是落地(往上彈),從下面撞到是頂到頭,其他是撞牆。彈起來可以再打同一隻。 */
  private bounceOnTerrain(p: Projectile, t: Phaser.GameObjects.GameObject): void {
    const body = p.shape.body as Phaser.Physics.Arcade.Body;
    const rect = t.body as Phaser.Physics.Arcade.StaticBody;
    const r = body.halfWidth;
    const prevBottom = body.prev.y + body.height;
    const prevTop = body.prev.y;
    const v = { vx: body.velocity.x, vy: body.velocity.y };
    if (prevBottom <= rect.top + 2 && v.vy > 0) {
      const out = bounceOff(v, 'floor');
      body.reset(p.shape.x, rect.top - r - 1);
      body.setVelocity(out.vx, Math.min(out.vy, -MIN_BOUNCE_VY));
    } else if (prevTop >= rect.bottom - 2 && v.vy < 0) {
      body.reset(p.shape.x, rect.bottom + r + 1);
      body.setVelocity(v.vx, Math.abs(v.vy));
    } else {
      const out = bounceOff(v, 'wall');
      body.reset(v.vx > 0 ? rect.left - r - 1 : rect.right + r + 1, p.shape.y);
      body.setVelocity(out.vx, out.vy);
    }
    p.hits.clear();
    this.spendBounce(p);
  }

  private spendBounce(p: Projectile): void {
    p.bouncesLeft -= 1;
    if (p.bouncesLeft < 0) this.remove(p);
  }

  /** 棉花糖、流星爆開:交給場景處理範圍傷害與畫面。 */
  private explode(p: Projectile): void {
    if (!this.projectiles.includes(p)) return;
    this.onBlast({ x: p.shape.x, y: p.shape.y, radius: p.def.blastRadius ?? 0, damage: p.damage, color: p.def.color });
    this.remove(p);
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
