import Phaser from 'phaser';
import { MAX_DT_MS } from '../config/tuning';
import { audio } from '../audio/audio';
import type { TerrainPalette } from '../art/scenes';
import { GROUND_Y, type LevelDef, type Rect } from '../levels/levelDef';
import { CRUMBLE_SHAKE_MS, MOVER_H, SPRING_H, SPRING_VY, SPRING_W, moverOffset, stepCrumble, type CrumbleState, type MoverDef } from './gadgets';
import type { PlayerEntity } from './playerEntity';

const OUTLINE = 0x3a2a5a;
/** 腳底離平台頂這麼近就算站在上面;載人時放寬一點(被頂起來的那一格)。 */
const STAND_EPS = 6;
const RIDE_EPS = 10;
/** 比平台往上快這麼多就是自己跳起來的,不跟著平台。 */
const JUMP_MARGIN = 250;
/** 彈跳墊的造型(依世界):蘑菇有白點點,其他是軟墊。 */
const SPRING_STYLE: Record<number, { top: number; base: number; dots: boolean }> = {
  1: { top: 0xe8505a, base: 0xf3e9d2, dots: true },
  2: { top: 0x6fae5a, base: 0xc8a060, dots: false },
  4: { top: 0xf4fbff, base: 0xa8d4f0, dots: false },
  5: { top: 0xe07040, base: 0x5a4040, dots: false },
  6: { top: 0x58b050, base: 0x3a6a30, dots: false },
  7: { top: 0xd0a060, base: 0x8a6440, dots: false },
  8: { top: 0xffffff, base: 0xd8e4ff, dots: false },
  9: { top: 0x9a7ae0, base: 0xf3e9d2, dots: true },
  10: { top: 0xffe08a, base: 0x7a6ab0, dots: false },
};

interface Mover {
  def: MoverDef;
  rect: Phaser.GameObjects.Rectangle;
  view: Phaser.GameObjects.Graphics | Phaser.GameObjects.TileSprite;
}

interface Spring {
  x: number;
  top: number;
  view: Phaser.GameObjects.Graphics;
}

interface Crumble {
  def: Rect;
  rect: Phaser.GameObjects.Rectangle;
  view: Phaser.GameObjects.Graphics;
  state: CrumbleState;
}

/** 三種新機關:移動平台(載著玩家走)、彈跳墊、會掉的平台。 */
export class GadgetSystem {
  readonly moverGroup: Phaser.Physics.Arcade.Group;
  readonly crumbleGroup: Phaser.Physics.Arcade.StaticGroup;
  bounces = 0;
  private readonly movers: Mover[] = [];
  private readonly springs: Spring[] = [];
  private readonly crumbles: Crumble[] = [];
  private tMs = 0;

  constructor(
    private readonly scene: Phaser.Scene,
    level: LevelDef,
    private readonly palette: TerrainPalette,
  ) {
    this.moverGroup = scene.physics.add.group({ allowGravity: false, immovable: true });
    this.crumbleGroup = scene.physics.add.staticGroup();
    const art = level.platformArt && scene.textures.exists(level.platformArt) ? level.platformArt : null;
    for (const def of level.movers ?? []) {
      const rect = scene.add.rectangle(def.x + def.w / 2, def.y + MOVER_H / 2, def.w, MOVER_H).setVisible(false);
      this.moverGroup.add(rect);
      const body = rect.body as Phaser.Physics.Arcade.Body;
      body.setAllowGravity(false).setImmovable(true);
      // 站在上面的玩家跟著左右走(Arcade 的 friction)。
      body.friction.set(1, 0);
      const view = art ? scene.add.tileSprite(def.x, def.y - 2, def.w, 28, art).setOrigin(0, 0) : this.platformGraphics(def.w, MOVER_H, true);
      view.setDepth(-2);
      this.movers.push({ def, rect, view });
    }
    const style = SPRING_STYLE[level.world] ?? SPRING_STYLE[1];
    for (const s of level.springs ?? []) {
      const top = (s.y ?? GROUND_Y) - SPRING_H;
      const view = scene.add.graphics().setDepth(-1).setPosition(s.x, top + SPRING_H);
      this.drawSpring(view, style);
      this.springs.push({ x: s.x, top, view });
    }
    for (const def of level.crumbles ?? []) {
      const rect = scene.add.rectangle(def.x + def.w / 2, def.y + def.h / 2, def.w, def.h).setVisible(false);
      this.crumbleGroup.add(rect);
      const view = this.platformGraphics(def.w, def.h, false).setPosition(def.x, def.y).setDepth(-2);
      this.crumbles.push({ def, rect, view, state: { phase: 'solid', ms: 0 } });
    }
  }

  /** 玩家站得上移動平台與會掉的平台。 */
  addPlayer(zone: Phaser.GameObjects.Zone): void {
    this.scene.physics.add.collider(zone, this.moverGroup);
    this.scene.physics.add.collider(zone, this.crumbleGroup);
  }

  /** 物理走這一格之前呼叫(用同一個 dt):移動平台設這一格的速度,剛好走到該在的位置;往下時站在上面的玩家一起往下。 */
  beforePhysics(dtMs: number, players: readonly PlayerEntity[], paused: boolean): void {
    if (paused || dtMs <= 0) {
      for (const m of this.movers) (m.rect.body as Phaser.Physics.Arcade.Body).setVelocity(0, 0);
      return;
    }
    this.tMs += dtMs;
    for (const m of this.movers) this.moveMover(m, dtMs, players);
  }

  /** 物理走完這一格之後呼叫:畫移動平台、彈跳、會掉的平台計時。 */
  update(dtMs: number, players: readonly PlayerEntity[], paused: boolean): void {
    const dt = Math.min(dtMs, MAX_DT_MS);
    for (const m of this.movers) {
      const body = m.rect.body as Phaser.Physics.Arcade.Body;
      m.view.setPosition(body.x, body.y - (m.view instanceof Phaser.GameObjects.TileSprite ? 2 : 0));
    }
    for (const s of this.springs) this.updateSpring(s, players);
    for (const c of this.crumbles) this.updateCrumble(c, dt, players, paused);
  }

  debug(): { movers: { x: number; y: number; w: number }[]; crumbles: CrumbleState['phase'][]; bounces: number } {
    return {
      movers: this.movers.map((m) => {
        const b = m.rect.body as Phaser.Physics.Arcade.Body;
        return { x: b.x, y: b.y, w: m.def.w };
      }),
      crumbles: this.crumbles.map((c) => c.state.phase),
      bounces: this.bounces,
    };
  }

  private moveMover(m: Mover, dtMs: number, players: readonly PlayerEntity[]): void {
    const body = m.rect.body as Phaser.Physics.Arcade.Body;
    // 速度 = (這一格結束時該在的位置 − 現在的位置) / 這一格的時間。
    const at = moverOffset(m.def, this.tMs);
    body.setVelocity(((m.def.x + at.x - body.x) * 1000) / dtMs, ((m.def.y + at.y - body.y) * 1000) / dtMs);
    // 站在上面的玩家上下都跟平台一樣快(往上時不會被彈飛、往下時不會飄起來);剛起跳的不管。
    const vy = body.velocity.y;
    for (const p of players) {
      if (p.health.down || !this.standingOn(p, body.x, body.y, m.def.w, RIDE_EPS)) continue;
      const pb = p.body();
      if (pb.velocity.y > vy - JUMP_MARGIN) pb.velocity.y = vy;
    }
  }

  private updateSpring(s: Spring, players: readonly PlayerEntity[]): void {
    for (const p of players) {
      if (p.health.down) continue;
      const pb = p.body();
      if (pb.velocity.y < 0 || Math.abs(p.x - s.x) > SPRING_W / 2 + 8) continue;
      if (pb.bottom < s.top - 4 || pb.bottom > s.top + SPRING_H) continue;
      pb.velocity.y = -SPRING_VY;
      this.bounces += 1;
      audio.sfx('spring');
      this.scene.tweens.killTweensOf(s.view);
      s.view.setScale(1.15, 0.6);
      this.scene.tweens.add({ targets: s.view, scaleX: 1, scaleY: 1, duration: 220, ease: 'Back.Out' });
    }
  }

  private updateCrumble(c: Crumble, dt: number, players: readonly PlayerEntity[], paused: boolean): void {
    if (paused) return;
    const body = c.rect.body as Phaser.Physics.Arcade.StaticBody;
    const stood = c.state.phase === 'solid' && players.some((p) => !p.health.down && this.standingOn(p, c.def.x, c.def.y, c.def.w));
    let next = stepCrumble(c.state, stood, dt);
    // 長回來的時候有人在那個位置,等他離開再長回來(不會把人卡在平台裡)。
    if (c.state.phase === 'fallen' && next.phase === 'solid' && players.some((p) => this.overlaps(p, c.def))) next = c.state;
    if (next.phase !== c.state.phase) this.changeCrumble(c, next.phase, body);
    c.state = next;
    if (next.phase === 'shaking') c.view.setX(c.def.x + (Math.floor(next.ms / 50) % 2 === 0 ? 2 : -2) * Math.min(1, next.ms / CRUMBLE_SHAKE_MS + 0.3));
  }

  private changeCrumble(c: Crumble, phase: CrumbleState['phase'], body: Phaser.Physics.Arcade.StaticBody): void {
    this.scene.tweens.killTweensOf(c.view);
    if (phase === 'fallen') {
      body.enable = false;
      this.scene.tweens.add({ targets: c.view, y: c.def.y + 80, alpha: 0, duration: 400 });
    } else if (phase === 'solid') {
      body.enable = true;
      c.view.setPosition(c.def.x, c.def.y).setAlpha(0);
      this.scene.tweens.add({ targets: c.view, alpha: 1, duration: 300 });
    }
  }

  private standingOn(p: PlayerEntity, left: number, top: number, w: number, eps = STAND_EPS): boolean {
    const pb = p.body();
    return Math.abs(pb.bottom - top) <= eps && pb.right > left && pb.left < left + w;
  }

  private overlaps(p: PlayerEntity, r: Rect): boolean {
    const pb = p.body();
    return pb.right > r.x && pb.left < r.x + r.w && pb.bottom > r.y && pb.top < r.y + r.h;
  }

  /** 平台的樣子(和地形一樣的配色);會掉的平台多畫裂縫。 */
  private platformGraphics(w: number, h: number, moving: boolean): Phaser.GameObjects.Graphics {
    const g = this.scene.add.graphics();
    const r = Math.min(8, h / 2);
    g.fillStyle(OUTLINE).fillRoundedRect(-2, -2, w + 4, h + 4, r + 2);
    g.fillStyle(this.palette.platform).fillRoundedRect(0, 0, w, h, r);
    g.fillStyle(this.palette.rim).fillRoundedRect(3, 2, w - 6, 4, 2);
    if (moving) {
      // 兩端的小箭頭:看得出會動。
      g.fillStyle(this.palette.rim).fillTriangle(6, h / 2 + 3, 12, h / 2 - 1, 12, h / 2 + 7);
      g.fillTriangle(w - 6, h / 2 + 3, w - 12, h / 2 - 1, w - 12, h / 2 + 7);
    } else {
      g.lineStyle(2, OUTLINE, 0.8);
      for (let x = w / 4; x < w; x += w / 4) g.lineBetween(x, 6, x + 4, h);
    }
    return g;
  }

  /** 彈跳墊(原點在底部中央):蘑菇或軟墊。 */
  private drawSpring(g: Phaser.GameObjects.Graphics, style: { top: number; base: number; dots: boolean }): void {
    const w = SPRING_W;
    g.fillStyle(OUTLINE).fillRoundedRect(-w / 4 - 2, -SPRING_H / 2 - 2, w / 2 + 4, SPRING_H / 2 + 2, 4);
    g.fillStyle(style.base).fillRoundedRect(-w / 4, -SPRING_H / 2, w / 2, SPRING_H / 2, 3);
    g.fillStyle(OUTLINE).fillEllipse(0, -SPRING_H / 2, w + 4, SPRING_H + 4);
    g.fillStyle(style.top).fillEllipse(0, -SPRING_H / 2, w, SPRING_H);
    g.fillStyle(0xffffff, 0.5).fillEllipse(-w / 6, -SPRING_H / 2 - 3, w / 3, 4);
    if (style.dots) {
      g.fillStyle(0xffffff);
      for (const dx of [-14, 2, 15]) g.fillCircle(dx, -SPRING_H / 2 + (dx === 2 ? -3 : 1), 3);
    }
  }
}
