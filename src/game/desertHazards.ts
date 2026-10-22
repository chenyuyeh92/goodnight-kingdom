import Phaser from 'phaser';
import { MAX_DT_MS } from '../config/tuning';
import { GROUND_Y, type Rect } from '../levels/levelDef';
import type { PlayerEntity } from './playerEntity';
import { SAND_JUMP, SAND_POP_VY, SAND_SPEED, freshSand, inQuicksand, sinkDepth, stepSand, type SandState } from './sand';
import {
  BLOCK_FALL_VY,
  BLOCK_LIFE_MS,
  BLOCK_WARN_MS,
  PLATE_W,
  landingTop,
  onPlate,
  stepPlate,
  type PlateDef,
  type PlateState,
} from './traps';
import type { Span } from './water';

const OUTLINE = 0x3a2a5a;
const SAND = 0xe8c27a;
const SAND_DARK = 0xb8894a;
const SHADOW = 0x2a2040;
/** 流沙圖的上緣比地面高一點,蓋住腳。 */
const SAND_TOP = GROUND_Y - 6;
const SAND_ART_H = 24;
/** 沙浪:沿著地面滑,高度跳得過。 */
export const WAVE_W = 36;
export const WAVE_H = 20;
export const WAVE_SPEED = 260;
const WAVE_RANGE = 1100;
/** 會掉下來的東西:沙磚、河狸的木頭落地後當踏板;冰柱、火山落石落地就碎掉。 */
export type DropKind = 'sand' | 'log' | 'icicle' | 'rock';
const DROPS: Record<DropKind, { key: string; w: number; h: number; color: number; solid: boolean; puff: number }> = {
  sand: { key: 'falling-block', w: 40, h: 38, color: SAND, solid: true, puff: SAND },
  log: { key: 'b-log', w: 40, h: 18, color: 0x8a5a3a, solid: true, puff: SAND },
  // 冰柱碎掉噴冰屑、落石噴灰。
  icicle: { key: 'icicle', w: 24, h: 56, color: 0xd8f0ff, solid: false, puff: 0xe0f4ff },
  rock: { key: 'falling-rock', w: 36, h: 36, color: 0x5a4a50, solid: false, puff: 0x8a7a80 },
};
/** 沙浪(沙塵)、河狸的水波、雪浪、河馬的震波、火龍沿地面燒過來的火。 */
export type WaveKind = 'sand' | 'water' | 'snow' | 'shock' | 'fire';
const WAVE_ART: Record<WaveKind, { key: string; color: number }> = {
  sand: { key: 'b-sand-dust', color: SAND },
  water: { key: 'b-water-wave', color: 0x8fd0f0 },
  snow: { key: '', color: 0xf0f8ff },
  shock: { key: 'b-shockwave', color: 0xe0d0c0 },
  fire: { key: '', color: 0xff7a30 },
};
const CRUMBLE_MS = 300;
const PLATE_PRESS_PX = 3;

type BlockStage = 'warn' | 'fall' | 'landed';

interface Block {
  x: number;
  w: number;
  h: number;
  /** 落地後會不會變成踏板(冰柱落地就碎掉)。 */
  platform: boolean;
  /** 落地、碎掉時噴出來的顏色。 */
  puffColor: number;
  stage: BlockStage;
  ms: number;
  /** 落地時底部的 y。 */
  landY: number;
  shadow: Phaser.GameObjects.Ellipse;
  view: Phaser.GameObjects.Image | Phaser.GameObjects.Rectangle;
  /** 落地後的平台;有玩家卡在裡面時先不變成實體。 */
  solid: Phaser.GameObjects.Rectangle | null;
}

interface Wave {
  view: Phaser.GameObjects.Image | Phaser.GameObjects.Ellipse;
  /** 建立時的縮放(圖片依顯示大小縮放過);起伏時在這上面乘。 */
  baseScaleY: number;
  dir: 1 | -1;
  delayMs: number;
  travelled: number;
}

export interface DesertOptions {
  sand: readonly Span[];
  plates: readonly PlateDef[];
  /** 關卡原本的平台(沙磚會落在上面)。 */
  platforms: readonly Rect[];
  terrain: Phaser.Physics.Arcade.StaticGroup;
  terrainBodies: Set<Phaser.Physics.Arcade.StaticBody>;
  players: () => readonly PlayerEntity[];
  /** 扣愛心(會檢查無敵與睡著)。 */
  hurt: (p: PlayerEntity) => void;
}

const overlaps = (a: { left: number; right: number; top: number; bottom: number }, x: number, y: number, w: number, h: number): boolean =>
  a.right > x - w / 2 && a.left < x + w / 2 && a.bottom > y - h / 2 && a.top < y + h / 2;

/** 沙漠的機關:流沙、壓力板與掉落沙磚、沙浪(人面獅身與駱駝也用)。 */
export class DesertHazards {
  private sandStates: SandState[] = [];
  private plateStates: PlateState[];
  private plateViews: (Phaser.GameObjects.Image | Phaser.GameObjects.Rectangle)[] = [];
  private blocks: Block[] = [];
  private waves: Wave[] = [];
  platesFired = 0;
  /** 陷進流沙扣愛心的次數。 */
  sinks = 0;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly opts: DesertOptions,
  ) {
    this.plateStates = opts.plates.map(() => ({ cooldownMs: 0 }));
    for (const s of opts.sand) this.drawSand(s);
    for (const p of opts.plates) this.plateViews.push(this.drawPlate(p));
  }

  /** 角色移動之後呼叫:流沙裡走得慢、跳得低,站久了陷下去扣愛心並彈出來。 */
  applySand(p: PlayerEntity, i: number, dtMs: number): void {
    const state = this.sandStates[i] ?? freshSand();
    const pb = p.body();
    const grounded = (pb.blocked.down || pb.touching.down) && p.feetY >= GROUND_Y - 2;
    const inSand = this.opts.sand.length > 0 && inQuicksand(p.x, this.opts.sand);
    if (inSand && !p.health.down && p.feetY >= GROUND_Y - 4) {
      pb.setVelocityX(pb.velocity.x * SAND_SPEED);
      if (p.jumped) pb.setVelocityY(pb.velocity.y * SAND_JUMP);
    }
    const r = stepSand(state, { inSand, grounded, down: p.health.down, dtMs });
    this.sandStates[i] = r.state;
    p.sink = sinkDepth(r.state);
    if (!r.sunk) return;
    this.sinks += 1;
    this.opts.hurt(p);
    pb.setVelocityY(SAND_POP_VY);
    this.puff(p.x, GROUND_Y);
  }

  /** 預告後從天上掉一塊沙磚。 */
  dropBlock(x: number, kind: DropKind = 'sand'): void {
    const d = DROPS[kind];
    const landY = landingTop(x, d.w, 0, this.surfaces(null));
    const shadow = this.scene.add.ellipse(x, landY, d.w * 0.4, 8, SHADOW, 0.5).setDepth(-1);
    const view = this.scene.textures.exists(d.key)
      ? this.scene.add.image(x, -d.h, d.key).setOrigin(0.5, 1).setDisplaySize(d.w, d.h)
      : this.scene.add.rectangle(x, -d.h, d.w, d.h, d.color).setOrigin(0.5, 1).setStrokeStyle(3, OUTLINE);
    view.setDepth(2).setVisible(false);
    this.blocks.push({ x, w: d.w, h: d.h, platform: d.solid, puffColor: d.puff, stage: 'warn', ms: 0, landY, shadow, view, solid: null });
  }

  /** 沿著地面滑的沙浪,delayMs 後出發。 */
  sendWave(x: number, dir: 1 | -1, delayMs = 0, kind: WaveKind = 'sand'): void {
    const art = WAVE_ART[kind];
    const y = GROUND_Y - WAVE_H / 2;
    const view = this.scene.textures.exists(art.key)
      ? this.scene.add.image(x, y, art.key).setDisplaySize(WAVE_W + 8, WAVE_H + 6).setFlipX(dir > 0)
      : this.scene.add.ellipse(x, y, WAVE_W, WAVE_H, art.color).setStrokeStyle(3, OUTLINE);
    view.setDepth(4).setVisible(delayMs === 0);
    this.waves.push({ view, baseScaleY: view.scaleY, dir, delayMs, travelled: 0 });
  }

  update(dtMs: number): void {
    const dt = Math.min(dtMs, MAX_DT_MS);
    const players = this.opts.players();
    this.opts.plates.forEach((plate, i) => {
      const pressed = players.some((p) => !p.health.down && onPlate(p.x, p.feetY, p.body().blocked.down || p.body().touching.down, plate));
      const r = stepPlate(this.plateStates[i], pressed, dt);
      this.plateStates[i] = r.state;
      if (!r.fire) return;
      this.platesFired += 1;
      const view = this.plateViews[i];
      this.scene.tweens.add({ targets: view, y: GROUND_Y + PLATE_PRESS_PX, duration: 80, yoyo: true, hold: 300 });
      for (const x of plate.drops) this.dropBlock(x);
    });
    for (const b of [...this.blocks]) this.updateBlock(b, dt, players);
    for (const w of [...this.waves]) this.updateWave(w, dt, players);
  }

  /** 打倒關主時清掉所有沙磚與沙浪。 */
  clear(): void {
    for (const b of [...this.blocks]) this.removeBlock(b);
    for (const w of [...this.waves]) this.removeWave(w);
  }

  debug(): { blocks: number; landed: number; bottoms: number[]; waves: number; sink: number[]; sinks: number; platesFired: number } {
    return {
      blocks: this.blocks.length,
      bottoms: this.blocks.filter((b) => b.stage === 'landed').map((b) => b.landY),
      landed: this.blocks.filter((b) => b.solid).length,
      waves: this.waves.length,
      sink: this.sandStates.map((s) => s.ms),
      sinks: this.sinks,
      platesFired: this.platesFired,
    };
  }

  /** 沙磚可以落在上面的表面:平台與已經落地的沙磚(不含 self)。 */
  private surfaces(self: Block | null): Rect[] {
    const landed = this.blocks
      .filter((b) => b !== self && b.platform && b.stage === 'landed')
      .map((b) => ({ x: b.x - b.w / 2, y: b.landY - b.h, w: b.w, h: b.h }));
    return [...this.opts.platforms, ...landed];
  }

  private updateBlock(b: Block, dt: number, players: readonly PlayerEntity[]): void {
    b.ms += dt;
    if (b.stage === 'warn') {
      const k = Math.min(1, b.ms / BLOCK_WARN_MS);
      b.shadow.setSize(b.w * (0.4 + 0.6 * k), 8).setAlpha(0.3 + 0.4 * k);
      if (b.ms < BLOCK_WARN_MS) return;
      b.stage = 'fall';
      b.ms = 0;
      b.view.setVisible(true);
      return;
    }
    if (b.stage === 'fall') {
      // 每格重新找落點:底下的沙磚可能已經碎掉了。
      b.landY = landingTop(b.x, b.w, b.view.y, this.surfaces(b));
      b.shadow.setY(b.landY);
      const y = Math.min(b.landY, b.view.y + (BLOCK_FALL_VY * dt) / 1000);
      b.view.setY(y);
      for (const p of players) {
        if (!p.health.down && overlaps(p.body(), b.x, y - b.h / 2, b.w - 6, b.h - 6)) this.opts.hurt(p);
      }
      if (y < b.landY) return;
      b.stage = 'landed';
      b.ms = 0;
      b.shadow.setVisible(false);
      this.scene.cameras.main.shake(80, 0.003);
      this.puff(b.x, b.landY, b.puffColor);
      return;
    }
    // 落地:沒有人卡在裡面才變成可以站的平台;時間到碎掉。
    if (!b.platform) {
      // 冰柱:落地就碎掉。
      this.removeBlock(b, true);
      return;
    }
    if (!b.solid && !players.some((p) => overlaps(p.body(), b.x, b.landY - b.h / 2, b.w, b.h))) {
      const r = this.scene.add.rectangle(b.x, b.landY - b.h / 2, b.w, b.h).setVisible(false);
      this.opts.terrain.add(r);
      this.opts.terrainBodies.add(r.body as Phaser.Physics.Arcade.StaticBody);
      b.solid = r;
    }
    if (b.ms < BLOCK_LIFE_MS) return;
    this.puff(b.x, b.landY, b.puffColor);
    this.removeBlock(b, true);
  }

  private removeBlock(b: Block, crumble = false): void {
    this.blocks = this.blocks.filter((x) => x !== b);
    this.unsolid(b);
    b.shadow.destroy();
    // 疊在上面的沙磚沒有東西撐了,繼續往下掉(不會浮在半空中);疊好幾層時一路檢查到穩定。
    for (let changed = true; changed; ) {
      changed = false;
      for (const o of this.blocks) {
        if (o.stage !== 'landed' || landingTop(o.x, o.w, o.landY, this.surfaces(o)) <= o.landY) continue;
        o.stage = 'fall';
        o.ms = 0;
        this.unsolid(o);
        changed = true;
      }
    }
    if (!crumble) {
      b.view.destroy();
      return;
    }
    this.scene.tweens.add({ targets: b.view, alpha: 0, scaleY: 0.3, duration: CRUMBLE_MS, onComplete: () => b.view.destroy() });
  }

  private unsolid(b: Block): void {
    if (!b.solid) return;
    this.opts.terrainBodies.delete(b.solid.body as Phaser.Physics.Arcade.StaticBody);
    this.opts.terrain.remove(b.solid, true, true);
    b.solid = null;
  }

  private updateWave(w: Wave, dt: number, players: readonly PlayerEntity[]): void {
    if (w.delayMs > 0) {
      w.delayMs -= dt;
      if (w.delayMs <= 0) w.view.setVisible(true);
      return;
    }
    const step = (WAVE_SPEED * dt) / 1000;
    w.view.setX(w.view.x + w.dir * step);
    w.travelled += step;
    // 沙浪上下起伏,看起來像在地上翻滾。
    w.view.setScale(w.view.scaleX, w.baseScaleY * (0.85 + 0.15 * Math.sin(w.travelled / 12)));
    for (const p of players) {
      if (!p.health.down && overlaps(p.body(), w.view.x, w.view.y, WAVE_W - 8, WAVE_H - 4)) this.opts.hurt(p);
    }
    if (w.travelled >= WAVE_RANGE) this.removeWave(w);
  }

  private removeWave(w: Wave): void {
    this.waves = this.waves.filter((x) => x !== w);
    w.view.destroy();
  }

  private drawSand(s: Span): void {
    if (this.scene.textures.exists('quicksand')) {
      this.scene.add.tileSprite(s.x, SAND_TOP, s.w, SAND_ART_H, 'quicksand').setOrigin(0, 0).setDepth(3);
      return;
    }
    const g = this.scene.add.graphics().setDepth(3);
    g.fillStyle(SAND, 0.9).fillRect(s.x, SAND_TOP, s.w, SAND_ART_H);
    g.lineStyle(2, SAND_DARK);
    for (let x = s.x + 10; x < s.x + s.w - 10; x += 24) {
      g.beginPath();
      g.arc(x + 6, SAND_TOP + 12, 6, Math.PI, 0, false);
      g.strokePath();
    }
  }

  private drawPlate(p: PlateDef): Phaser.GameObjects.Image | Phaser.GameObjects.Rectangle {
    if (this.scene.textures.exists('pressure-plate')) return this.scene.add.image(p.x, GROUND_Y, 'pressure-plate').setOrigin(0.5, 1).setDepth(-1);
    return this.scene.add.rectangle(p.x, GROUND_Y, PLATE_W, 8, 0xc8a060).setOrigin(0.5, 1).setStrokeStyle(2, OUTLINE).setDepth(-1);
  }

  private puff(x: number, y: number, color = SAND): void {
    for (let i = 0; i < 5; i++) {
      const d = this.scene.add.circle(x + (i - 2) * 8, y - 4, 5, color).setDepth(5);
      this.scene.tweens.add({ targets: d, y: y - 24 - (i % 2) * 10, alpha: 0, duration: 450, onComplete: () => d.destroy() });
    }
  }
}
