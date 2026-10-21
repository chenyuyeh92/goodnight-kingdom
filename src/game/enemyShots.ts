import Phaser from 'phaser';

const SHOT_W = 12;
const SHOT_H = 6;
const SHOT_COLOR = 0xf3e9d2;
const SHOT_LIFE_MS = 4000;

interface Shot {
  rect: Phaser.GameObjects.Rectangle;
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
    scene.physics.add.overlap(this.group, terrain, (s) => this.removeObj(s));
  }

  /** onHit 回傳 true 表示打中(羽毛消失),false 表示穿過(例如玩家睡著)。 */
  addVictim(zone: Phaser.GameObjects.Zone, onHit: () => boolean): void {
    this.scene.physics.add.overlap(zone, this.group, (_z, s) => {
      if (onHit()) this.removeObj(s);
    });
  }

  fire(x: number, y: number, vx: number, vy: number): void {
    const rect = this.scene.add.rectangle(x, y, SHOT_W, SHOT_H, SHOT_COLOR).setRotation(Math.atan2(vy, vx));
    this.group.add(rect);
    (rect.body as Phaser.Physics.Arcade.Body).setVelocity(vx, vy);
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
