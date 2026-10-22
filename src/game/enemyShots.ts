import Phaser from 'phaser';

const SHOT_LIFE_MS = 4000;
/** 剛射出的子彈這段時間內穿過地形(駱駝站在踏板下吐口水,不會一出嘴就消失)。 */
const TERRAIN_GRACE_MS = 120;
const SHOT_OUTLINE = 0x3a2a5a;

/** 魔物子彈的種類:貓頭鷹羽毛、沙蛇咖啡(章魚墨汁)、駱駝口水、沙球/沙塊、泡泡。 */
export type ShotKind = 'feather' | 'coffee' | 'spit' | 'sand' | 'bubble';

/** 奶油色、咖啡色、淡藍、沙黃,都加深紫外框,在亮暗背景都看得到。 */
const SHOT_LOOK: Record<ShotKind, { w: number; h: number; color: number }> = {
  feather: { w: 12, h: 6, color: 0xf3e9d2 },
  coffee: { w: 11, h: 11, color: 0x8b5e3c },
  spit: { w: 12, h: 12, color: 0xd8f0ff },
  sand: { w: 13, h: 13, color: 0xf0c060 },
  bubble: { w: 16, h: 16, color: 0xa8e8ff },
};

const textureKey = (kind: ShotKind): string => `gk-shot-${kind}`;

interface Shot {
  rect: Phaser.GameObjects.Image;
  bornAt: number;
}

/** 魔物發射的子彈(貓頭鷹的羽毛):碰地形消失,碰到醒著的玩家造成傷害。 */
export class EnemyShotSystem {
  private readonly group: Phaser.Physics.Arcade.Group;
  private shots: Shot[] = [];

  constructor(
    private readonly scene: Phaser.Scene,
    terrain: Phaser.Physics.Arcade.StaticGroup,
  ) {
    this.group = scene.physics.add.group({ allowGravity: false });
    for (const [kind, look] of Object.entries(SHOT_LOOK)) {
      const key = textureKey(kind as ShotKind);
      if (scene.textures.exists(key)) continue;
      const g = scene.make.graphics({}, false);
      g.fillStyle(SHOT_OUTLINE).fillEllipse(look.w / 2 + 2, look.h / 2 + 2, look.w + 4, look.h + 4);
      g.fillStyle(look.color).fillEllipse(look.w / 2 + 2, look.h / 2 + 2, look.w, look.h);
      g.fillStyle(0xffffff, 0.6).fillCircle(look.w / 2, look.h / 2, Math.min(look.w, look.h) / 5);
      g.generateTexture(key, look.w + 4, look.h + 4);
      g.destroy();
    }
    scene.physics.add.overlap(this.group, terrain, (s) => {
      const shot = this.shots.find((x) => x.rect === s);
      if (shot && this.scene.time.now - shot.bornAt >= TERRAIN_GRACE_MS) this.remove(shot);
    });
  }

  /** onHit 回傳 true 表示打中(羽毛消失),false 表示穿過(例如玩家睡著)。 */
  addVictim(zone: Phaser.GameObjects.Zone, onHit: () => boolean): void {
    this.scene.physics.add.overlap(zone, this.group, (_z, s) => {
      if (onHit()) this.removeObj(s);
    });
  }

  /** gravity > 0 時走拋物線(沙蛇咖啡、駱駝口水、沙塊)。 */
  fire(x: number, y: number, vx: number, vy: number, kind: ShotKind = 'feather', gravity = 0): void {
    const rect = this.scene.add.image(x, y, textureKey(kind)).setRotation(Math.atan2(vy, vx)).setDepth(4);
    this.group.add(rect);
    const body = rect.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(vx, vy);
    if (gravity > 0) body.setAllowGravity(true).setGravityY(gravity);
    this.shots.push({ rect, bornAt: this.scene.time.now });
  }

  update(): void {
    const now = this.scene.time.now;
    for (const s of [...this.shots]) if (now - s.bornAt > SHOT_LIFE_MS) this.remove(s);
  }

  count(): number {
    return this.shots.length;
  }

  clear(): void {
    for (const s of [...this.shots]) this.remove(s);
  }

  private removeObj(obj: unknown): void {
    const s = this.shots.find((x) => x.rect === obj);
    if (s) this.remove(s);
  }

  private remove(s: Shot): void {
    this.shots = this.shots.filter((x) => x !== s);
    s.rect.destroy();
  }
}
