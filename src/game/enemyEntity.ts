import Phaser from 'phaser';
import type { EnemyDebug } from '../main';
import { ENEMY_DEFS, initialBrain, stepEnemy, type EnemyBrain, type EnemyDef, type EnemyType } from './enemies';
import { OWL_ART_SCALE, enemySprite, type SpriteKey } from '../art/sprites';
import { enemyPose } from '../art/motion';

const SHIELD_W = 3;
const SHIELD_ALPHA = 0.5;
const FLASH_MS = 80;
const COLOR_FLASH = 0xffffff;
const COLOR_SHIELD = 0xffffff;

/** 一隻魔物:色塊、物理 body、行為狀態與血量。 */
export class EnemyEntity {
  readonly def: EnemyDef;
  readonly body: Phaser.GameObjects.Rectangle;
  brain: EnemyBrain;
  hp: number;
  /** 正在從地面冒出,還不算上場。 */
  emerging = false;
  private readonly shield: Phaser.GameObjects.Rectangle | null;
  /** 美術圖;沒載入時為 null,改顯示色塊。 */
  private readonly art: Phaser.GameObjects.Image | null;
  private artFacing: 1 | -1 = -1;
  /** 每隻魔物的動作錯開,不會整群同步擺動。 */
  private readonly animOffset = Math.random() * 1000;

  constructor(
    private readonly scene: Phaser.Scene,
    type: EnemyType,
    x: number,
    feetY: number,
    readonly arena: boolean,
  ) {
    this.def = ENEMY_DEFS[type];
    this.brain = initialBrain(type);
    this.hp = this.def.hp;
    this.body = scene.add.rectangle(x, feetY - this.def.h / 2, this.def.w, this.def.h, this.def.color);
    scene.physics.add.existing(this.body);
    this.physicsBody().setAllowGravity(!this.def.flying);
    this.shield = this.def.shield
      ? scene.add.rectangle(x, this.body.y, SHIELD_W, this.def.h, COLOR_SHIELD).setAlpha(SHIELD_ALPHA)
      : null;
    const key = enemySprite(type, 'awake');
    this.art = scene.textures.exists(key) ? scene.add.image(x, feetY, key).setOrigin(0.5, 1) : null;
    if (this.art) {
      this.body.setVisible(false);
      if (type === 'nightOwl') this.art.setScale(OWL_ART_SCALE);
    }
    this.render();
  }

  /** 換圖(貓頭鷹換階段);沒有這張圖時維持原樣。 */
  setArt(key: SpriteKey): void {
    if (this.art && this.scene.textures.exists(key) && this.art.texture.key !== key) this.art.setTexture(key);
  }

  /** 美術圖(給睡著動畫取位置與大小),沒有時為 null。 */
  artImage(): Phaser.GameObjects.Image | null {
    return this.art;
  }

  physicsBody(): Phaser.Physics.Arcade.Body {
    return this.body.body as Phaser.Physics.Arcade.Body;
  }

  get x(): number {
    return this.body.x;
  }

  update(targetX: number | null, dtMs: number, gravity: number): void {
    const pb = this.physicsBody();
    if (!this.def.flying) pb.setGravityY(gravity);
    const move = stepEnemy(this.def.type, this.brain, {
      x: this.body.x,
      y: this.body.y,
      grounded: pb.blocked.down || pb.touching.down,
      targetX,
      dtMs,
    });
    this.brain = move.brain;
    pb.setVelocity(move.vx, move.vy ?? pb.velocity.y);
  }

  flash(): void {
    this.body.setFillStyle(COLOR_FLASH);
    this.art?.setTint(COLOR_FLASH).setTintMode(Phaser.TintModes.FILL);
    this.scene.time.delayedCall(FLASH_MS, () => {
      if (this.body.active) this.body.setFillStyle(this.def.color);
      if (this.art?.active) this.art.clearTint().setTintMode(Phaser.TintModes.MULTIPLY);
    });
  }

  render(): void {
    this.shield?.setPosition(this.body.x + (this.brain.facing * (this.def.w - SHIELD_W)) / 2, this.body.y);
    if (!this.art) return;
    // 素材朝左;貓頭鷹依飛行方向轉,其他魔物依面向。
    if (this.def.type === 'nightOwl') {
      const vx = this.physicsBody()?.velocity.x ?? 0;
      if (Math.abs(vx) > 20) this.artFacing = vx > 0 ? 1 : -1;
    } else {
      this.artFacing = this.brain.facing;
    }
    this.art.setFlipX(this.artFacing > 0);
    const pb = this.physicsBody();
    const grounded = pb ? pb.blocked.down || pb.touching.down : true;
    const pose = enemyPose(this.def.type, this.brain.phase, this.scene.time.now + this.animOffset, pb?.velocity.x ?? 0, pb?.velocity.y ?? 0, grounded);
    const base = this.def.type === 'nightOwl' ? OWL_ART_SCALE : 1;
    const bottom = this.body.y + this.def.h / 2;
    if (pose.spin) {
      this.art.setOrigin(0.5, 0.5).setPosition(this.body.x, bottom - (this.art.height * base) / 2);
    } else {
      this.art.setOrigin(0.5, 1).setPosition(this.body.x, bottom + pose.dy);
    }
    this.art.setScale(base * pose.scaleX, base * pose.scaleY).setAngle(pose.angle);
    this.art.setAlpha(this.body.alpha);
  }

  destroy(): void {
    this.body.destroy();
    this.shield?.destroy();
    this.art?.destroy();
  }

  debug(): EnemyDebug {
    return {
      type: this.def.type,
      hp: this.hp,
      x: this.body.x,
      y: this.body.y,
      facing: this.brain.facing,
      phase: this.brain.phase,
      arena: this.arena,
      artX: this.art?.x ?? null,
      artBottom: this.art?.y ?? null,
    };
  }
}
