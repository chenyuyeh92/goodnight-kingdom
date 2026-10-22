import Phaser from 'phaser';

const SHOT_LIFE_MS = 4000;
/** 剛射出的子彈這段時間內穿過地形(駱駝站在踏板下吐口水,不會一出嘴就消失)。 */
const TERRAIN_GRACE_MS = 120;
const SHOT_OUTLINE = 0x3a2a5a;

/** 魔物子彈的種類:貓頭鷹羽毛、沙蛇咖啡(章魚墨汁)、駱駝口水、沙球/沙塊、泡泡、松鼠的橡實。 */
export type ShotKind = 'feather' | 'coffee' | 'spit' | 'sand' | 'bubble' | 'acorn' | 'snow' | 'ice' | 'steam' | 'lava' | 'mango' | 'sweep' | 'jet' | 'roar' | 'rock' | 'bamboo' | 'stone' | 'waterBubble' | 'spark' | 'mochi' | 'dart' | 'mist';

/** 奶油色、咖啡色、淡藍、沙黃,都加深紫外框,在亮暗背景都看得到。 */
const SHOT_LOOK: Record<ShotKind, { w: number; h: number; color: number }> = {
  feather: { w: 12, h: 6, color: 0xf3e9d2 },
  coffee: { w: 11, h: 11, color: 0x8b5e3c },
  spit: { w: 12, h: 12, color: 0xd8f0ff },
  sand: { w: 13, h: 13, color: 0xf0c060 },
  bubble: { w: 16, h: 16, color: 0xa8e8ff },
  acorn: { w: 14, h: 16, color: 0xa0683a },
  snow: { w: 16, h: 16, color: 0xffffff },
  ice: { w: 12, h: 12, color: 0xc8f0ff },
  steam: { w: 30, h: 24, color: 0xf4f4f8 },
  lava: { w: 16, h: 16, color: 0xff7a30 },
  mango: { w: 18, h: 18, color: 0xffb030 },
  // 長頸鹿的脖子橫掃(扁長的一道)、大象的水柱、獅子王的吼聲音波。
  sweep: { w: 64, h: 16, color: 0xf0c060 },
  jet: { w: 28, h: 12, color: 0x8fd0f0 },
  roar: { w: 22, h: 36, color: 0xfff0c0 },
  // 山羊踢的石頭、熊貓的迴旋竹子。
  rock: { w: 20, h: 18, color: 0x8a8a9a },
  bamboo: { w: 38, h: 10, color: 0x7ac05a },
  // 巨鼴鼠挖出的石塊、六角恐龍的水泡、螢火蟲女王的光點。
  stone: { w: 20, h: 18, color: 0x7a6a6a },
  waterBubble: { w: 16, h: 16, color: 0xa8e8ff },
  spark: { w: 14, h: 14, color: 0xfff080 },
  // 月兔的麻糬(黏到會變慢)、孔雀的羽毛飛鏢、夢貘的惡夢雲。
  mochi: { w: 20, h: 16, color: 0xfff8f0 },
  dart: { w: 32, h: 10, color: 0x3aa08a },
  mist: { w: 38, h: 26, color: 0x8a6ac0 },
};

/** 有美術圖的子彈(載入了就用美術的圖,沒有就用上面程式畫的)。 */
const SHOT_ART: Partial<Record<ShotKind, string>> = { spit: 'b-spit', bubble: 'b-bubble', acorn: 'b-acorn', steam: 'b-steam', lava: 'b-lava-ball', mango: 'b-mango', jet: 'b-water-jet', rock: 'b-w8-rock', bamboo: 'b-bamboo', stone: 'b-w9-rock', waterBubble: 'b-w9-bubble', spark: 'b-firefly', mochi: 'b-mochi', dart: 'b-w10-feather', mist: 'b-dream-mist' };
/** 有方向的子彈圖(畫成朝左),往右飛時左右翻過來。 */
const FLIP_RIGHT: ReadonlySet<ShotKind> = new Set(['dart', 'mist']);

const textureKey = (kind: ShotKind): string => `gk-shot-${kind}`;

interface Shot {
  rect: Phaser.GameObjects.Image;
  kind: ShotKind;
  bornAt: number;
  lifeMs: number;
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

  /** onHit 回傳 true 表示打中(羽毛消失),false 表示穿過(例如玩家睡著);kind 是打中的子彈種類(麻糬不扣愛心、會變慢)。 */
  addVictim(zone: Phaser.GameObjects.Zone, onHit: (kind: ShotKind) => boolean): void {
    this.scene.physics.add.overlap(zone, this.group, (_z, s) => {
      const shot = this.shots.find((x) => x.rect === s);
      if (shot && onHit(shot.kind)) this.remove(shot);
    });
  }

  /**
   * gravity > 0 時走拋物線(沙蛇咖啡、駱駝口水、沙塊);飄得慢的(河馬的蒸氣)可以活久一點;
   * ax 是水平加速度(熊貓的迴旋竹子:往前飛、慢慢減速、再飛回來)。
   */
  fire(x: number, y: number, vx: number, vy: number, kind: ShotKind = 'feather', gravity = 0, lifeMs = SHOT_LIFE_MS, ax = 0): void {
    const art = SHOT_ART[kind];
    const key = art && this.scene.textures.exists(art) ? art : textureKey(kind);
    // 圓的子彈(泡泡、口水、橡實)不用轉向。
    const rect = this.scene.add.image(x, y, key).setRotation(key === art ? 0 : Math.atan2(vy, vx)).setDepth(4);
    if (key === art && FLIP_RIGHT.has(kind) && vx > 0) rect.setFlipX(true);
    this.group.add(rect);
    const body = rect.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(vx, vy);
    if (gravity > 0) body.setAllowGravity(true).setGravityY(gravity);
    if (ax !== 0) body.setAccelerationX(ax);
    this.shots.push({ rect, kind, bornAt: this.scene.time.now, lifeMs });
  }

  update(): void {
    const now = this.scene.time.now;
    for (const s of [...this.shots]) if (now - s.bornAt > s.lifeMs) this.remove(s);
  }

  count(): number {
    return this.shots.length;
  }

  clear(): void {
    for (const s of [...this.shots]) this.remove(s);
  }

  private remove(s: Shot): void {
    this.shots = this.shots.filter((x) => x !== s);
    s.rect.destroy();
  }
}
