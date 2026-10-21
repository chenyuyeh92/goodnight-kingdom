import Phaser from 'phaser';
import type { EnemyDebug } from '../main';
import { ENEMY_DEFS, initialBrain, stepEnemy, type EnemyBrain, type EnemyDef, type EnemyType } from './enemies';

const SHIELD_W = 4;
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
    this.shield = this.def.shield ? scene.add.rectangle(x, this.body.y, SHIELD_W, this.def.h, COLOR_SHIELD) : null;
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
    this.scene.time.delayedCall(FLASH_MS, () => {
      if (this.body.active) this.body.setFillStyle(this.def.color);
    });
  }

  render(): void {
    this.shield?.setPosition(this.body.x + (this.brain.facing * (this.def.w - SHIELD_W)) / 2, this.body.y);
  }

  destroy(): void {
    this.body.destroy();
    this.shield?.destroy();
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
    };
  }
}
