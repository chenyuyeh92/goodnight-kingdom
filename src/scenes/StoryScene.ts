import Phaser from 'phaser';
import { audio } from '../audio/audio';
import { artStatus, assetPath, enemySprite, type SpriteKey } from '../art/sprites';
import { sceneKeys } from '../art/scenes';
import { createSaveStore } from '../game/save';
import { OPENING, type StoryBeat } from '../story/script';
import { initialTypewriter, stepTypewriter, tapTypewriter, typedText, type Typewriter } from '../story/typewriter';
import type { TestRangeData } from './TestRangeScene';

export type StoryId = 'opening';

export interface StoryData extends TestRangeData {
  story: StoryId;
  /** 看完(或跳過)後去哪裡。 */
  then: { scene: string; data: object };
}

const W = 960;
const H = 540;
const TEXT_TOP = 432;
const FADE_MS = 400;
/** 晚安王國(世界 10 黃昏的城堡外面,調成夜晚的藍色)、失眠森林的晚上。 */
const KINGDOM_SCENE = 'w10-s2' as const;
const NIGHT_TINT = 0x5a63b0;
const FOREST_SCENE = 'w1-s3' as const;
const WINDOWS_JSON = 'story-town-windows';
const LIGHT = 0xffe08a;

const STORIES: Record<StoryId, readonly StoryBeat[]> = { opening: OPENING };

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * 故事畫面(動態繪本):每一幕用現有的背景與角色圖拼出來、加上簡單的動作;美術組畫了整幕插圖的就用插圖。
 * 文字一個字一個字出現;點一下(或按任意鍵)先把這一幕顯示完,再點才到下一幕;右上角「跳過」直接結束。
 */
export class StoryScene extends Phaser.Scene {
  private data_!: StoryData;
  private beats: readonly StoryBeat[] = [];
  private index = 0;
  private typer: Typewriter = initialTypewriter([]);
  private layer: Phaser.GameObjects.Container | null = null;
  private lineTexts: Phaser.GameObjects.Text[] = [];
  private finished = false;

  constructor() {
    super('Story');
  }

  init(data: StoryData): void {
    this.data_ = data;
    this.beats = STORIES[data.story];
    this.index = 0;
    this.finished = false;
  }

  /** 背景圖在關卡裡才載入,故事用到的這裡先載。 */
  preload(): void {
    const base = import.meta.env.BASE_URL;
    if (!this.cache.json.exists(WINDOWS_JSON)) this.load.json(WINDOWS_JSON, `${base}assets/story/town-houses-windows.json`);
    if (artStatus.disabled) return;
    const keys = sceneKeys([KINGDOM_SCENE, FOREST_SCENE]).filter((k) => !this.textures.exists(k) && !artStatus.missing.includes(k));
    for (const k of keys) this.load.image(k, `${base}${assetPath(k)}`);
  }

  create(): void {
    audio.music('menu');
    this.cameras.main.setBackgroundColor('#0d0b24');
    this.add.rectangle(W / 2, (TEXT_TOP + H) / 2, W, H - TEXT_TOP, 0x0d0b24, 0.82).setDepth(10);
    this.lineTexts = [0, 1].map((i) =>
      this.add
        .text(W / 2, TEXT_TOP + 34 + i * 38, '', { fontSize: '24px', color: '#f3e9d2', stroke: '#0d0b24', strokeThickness: 4 })
        .setOrigin(0.5)
        .setDepth(11),
    );
    const skip = this.add
      .text(W - 16, 16, '跳過 ▶▶', { fontSize: '20px', color: '#f3e9d2', backgroundColor: '#2b2a6b', padding: { x: 10, y: 6 } })
      .setOrigin(1, 0)
      .setDepth(12)
      .setInteractive({ useHandCursor: true });
    skip.on('pointerdown', (_p: Phaser.Input.Pointer, _x: number, _y: number, e: Phaser.Types.Input.EventData) => {
      e.stopPropagation();
      this.finish();
    });
    this.input.on('pointerdown', () => this.tap());
    this.input.keyboard?.on('keydown', (e: KeyboardEvent) => {
      if (e.repeat) return;
      if (e.code === 'Escape') this.finish();
      else this.tap();
    });
    this.showBeat(0);
  }

  update(_time: number, dtMs: number): void {
    if (this.finished) return;
    this.typer = stepTypewriter(this.typer, dtMs);
    this.renderText();
  }

  private tap(): void {
    if (this.finished) return;
    const r = tapTypewriter(this.typer);
    this.typer = r.state;
    if (!r.advance) {
      this.renderText();
      return;
    }
    if (this.index + 1 >= this.beats.length) this.finish();
    else this.showBeat(this.index + 1);
  }

  private finish(): void {
    if (this.finished) return;
    this.finished = true;
    (this.data_.save ?? createSaveStore(null)).markStory(this.data_.story);
    this.cameras.main.fadeOut(FADE_MS, 13, 11, 36);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start(this.data_.then.scene, this.data_.then.data));
  }

  private showBeat(i: number): void {
    this.index = i;
    const beat = this.beats[i];
    const old = this.layer;
    if (old) this.tweens.add({ targets: old, alpha: 0, duration: FADE_MS, onComplete: () => old.destroy() });
    const layer = this.add.container(0, 0).setAlpha(0);
    this.layer = layer;
    BUILD[beat.id]?.(this, layer);
    this.tweens.add({ targets: layer, alpha: 1, duration: FADE_MS });
    this.typer = initialTypewriter(beat.lines);
    this.renderText();
  }

  private renderText(): void {
    const typed = typedText(this.typer);
    this.lineTexts.forEach((t, i) => t.setText(typed[i] ?? ''));
    window.__GK__ = {
      ready: true,
      screen: 'story',
      story: { id: this.data_.story, beat: this.index, beats: this.beats.length, beatId: this.beats[this.index].id, text: typed, done: this.typer.done },
    };
  }

  // ---- 拼畫面用的小工具 ----

  /** 整張背景(多層時左右平移);沒有圖時是夜空色塊。 */
  bg(layer: Phaser.GameObjects.Container, keys: readonly SpriteKey[], panMs = 0, tint: number | null = null): void {
    layer.add(this.add.rectangle(W / 2, H / 2, W, H, 0x1a1840));
    keys.forEach((k, depth) => {
      if (!this.textures.exists(k)) return;
      const img = this.add.image(0, 0, k).setOrigin(0, 0);
      img.setScale(H / img.height);
      if (tint !== null) img.setTint(tint);
      layer.add(img);
      const extra = img.displayWidth - W;
      if (panMs > 0 && extra > 0) this.tweens.add({ targets: img, x: -extra * (0.4 + 0.3 * depth), duration: panMs, ease: 'Sine.easeInOut' });
    });
  }

  image(layer: Phaser.GameObjects.Container, key: string, x: number, y: number, scale = 1): Phaser.GameObjects.Image | null {
    if (!this.textures.exists(key)) return null;
    const img = this.add.image(x, y, key).setScale(scale);
    layer.add(img);
    return img;
  }

  /** 晚安王國的夜景:城堡外面調成夜晚的藍色,天上星星一閃一閃。 */
  kingdom(layer: Phaser.GameObjects.Container, panMs = 0): void {
    this.bg(layer, sceneKeys([KINGDOM_SCENE]).slice(0, panMs > 0 ? 2 : 1), panMs, NIGHT_TINT);
    for (let i = 0; i < 24; i++) {
      const star = this.add.circle(Phaser.Math.Between(10, W - 10), Phaser.Math.Between(10, 200), Phaser.Math.Between(1, 2), 0xfff6c8);
      layer.add(star);
      this.tweens.add({ targets: star, alpha: { from: 1, to: 0.2 }, duration: Phaser.Math.Between(700, 1600), yoyo: true, repeat: -1 });
    }
  }

  /** 城下的房子,窗戶依 lit 決定一開始亮不亮;回傳窗戶燈光(依序熄燈、亮燈用)。 */
  town(layer: Phaser.GameObjects.Container, lit: boolean): Phaser.GameObjects.Rectangle[] {
    const y0 = H - 220 - (H - TEXT_TOP) + 30;
    this.image(layer, 'story-town-houses', W / 2, y0 + 110);
    const wins = (this.cache.json.get(WINDOWS_JSON) as { windows?: Rect[] } | undefined)?.windows ?? [];
    return wins.map((r) => {
      const light = this.add.rectangle(r.x + r.w / 2, y0 + r.y + r.h / 2, r.w, r.h, LIGHT).setAlpha(lit ? 0.95 : 0);
      layer.add(light);
      return light;
    });
  }

  /** 一直重複:每隔 everyMs 做一次(換幕時跟著這一幕的畫面一起停)。 */
  repeat(layer: Phaser.GameObjects.Container, everyMs: number, fn: () => void): void {
    const ev = this.time.addEvent({ delay: everyMs, loop: true, callback: () => (layer.active ? fn() : ev.remove()) });
  }

  /** 黑色的雪(惡夢):從上面慢慢飄下來。 */
  blackSnow(layer: Phaser.GameObjects.Container): void {
    this.repeat(layer, 120, () => {
      const flake = this.add.circle(Phaser.Math.Between(0, W), -10, Phaser.Math.Between(2, 5), 0x1a1426, 0.85);
      layer.add(flake);
      this.tweens.add({
        targets: flake,
        y: TEXT_TOP,
        x: flake.x + Phaser.Math.Between(-40, 40),
        duration: Phaser.Math.Between(3000, 5000),
        onComplete: () => flake.destroy(),
      });
    });
  }

  /** 睜大眼睛的失眠魔物,站在地上(有圖才放)。 */
  monsters(layer: Phaser.GameObjects.Container, jumpy: boolean): void {
    const ground = TEXT_TOP - 8;
    const cast = [
      { type: 'alarmBug', x: 240 },
      { type: 'hedgehog', x: 420 },
      { type: 'coffeeBean', x: 600 },
      { type: 'alarmBug', x: 760 },
    ] as const;
    cast.forEach((c, i) => {
      const img = this.image(layer, enemySprite(c.type, 'awake'), c.x, ground, 1.3);
      if (!img) return;
      img.setOrigin(0.5, 1).setFlipX(i % 2 === 1);
      this.tweens.add({
        targets: img,
        y: ground - (jumpy ? 40 : 6),
        duration: jumpy ? 260 + i * 40 : 900 + i * 120,
        yoyo: true,
        repeat: -1,
        ease: jumpy ? 'Quad.easeOut' : 'Sine.easeInOut',
      });
    });
    const bat = this.image(layer, enemySprite('nightBat', 'awake'), 520, 150, 1.3);
    if (bat) this.tweens.add({ targets: bat, x: 380, y: 120, duration: jumpy ? 700 : 2400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  }
}

/** 每一幕怎麼拼。 */
const BUILD: Record<string, (s: StoryScene, layer: Phaser.GameObjects.Container) => void> = {
  // 1 夜空下的晚安王國,遠方是月亮城堡;鏡頭慢慢往右平移。
  kingdom(s, layer) {
    s.kingdom(layer, 9000);
  },
  // 2 城下的房子,窗戶一盞一盞熄燈。
  lightsOff(s, layer) {
    s.kingdom(layer);
    s.town(layer, true).forEach((light, i, all) => {
      s.tweens.add({ targets: light, alpha: 0, duration: 500, delay: 900 + ((i * 7) % all.length) * 260 });
    });
  },
  // 3 城堡屋頂上的大影子,細細的黑霧從各家屋頂飄向牠(美術組畫的整幕插圖)。
  shadow(s, layer) {
    const art = s.image(layer, 'story-opening-3', W / 2, H / 2);
    if (art) s.tweens.add({ targets: art, scale: 1.06, duration: 9000, ease: 'Sine.easeInOut' });
    else {
      s.kingdom(layer);
      s.image(layer, 'story-castle-roof', 600, 300);
      s.image(layer, 'story-tapir-silhouette', 600, 200);
    }
    s.repeat(layer, 260, () => {
      const wisp = s.add.circle(Phaser.Math.Between(40, 920), 400, Phaser.Math.Between(3, 6), 0x1a1426, 0.6);
      layer.add(wisp);
      s.tweens.add({ targets: wisp, x: 460, y: 290, alpha: 0, scale: 0.4, duration: 2600, ease: 'Sine.easeIn', onComplete: () => wisp.destroy() });
    });
  },
  // 4 失眠森林,魔物們睜大眼睛;黑色的雪慢慢飄下。
  blackSnow(s, layer) {
    s.bg(layer, sceneKeys([FOREST_SCENE]));
    s.monsters(layer, false);
    s.blackSnow(layer);
  },
  // 5 魔物們吵吵鬧鬧,城裡的窗戶又一盞一盞亮起。
  noisy(s, layer) {
    s.kingdom(layer);
    s.town(layer, false).forEach((light, i, all) => {
      s.tweens.add({ targets: light, alpha: 0.95, duration: 300, delay: 500 + ((i * 5) % all.length) * 180 });
    });
    s.monsters(layer, true);
    s.repeat(layer, 450, () => {
      const mark = s.add
        .text(Phaser.Math.Between(180, 800), Phaser.Math.Between(260, 360), Phaser.Math.RND.pick(['!', '♪', '!?', '鈴鈴']), {
          fontSize: '28px',
          color: '#ffe08a',
          stroke: '#2b2a6b',
          strokeThickness: 4,
        })
        .setOrigin(0.5);
      layer.add(mark);
      s.tweens.add({ targets: mark, y: mark.y - 40, alpha: 0, duration: 900, onComplete: () => mark.destroy() });
    });
  },
  // 6 兩位守衛(背影)拿著哈欠泡泡往森林走。
  setOff(s, layer) {
    s.bg(layer, sceneKeys([FOREST_SCENE]));
    const guards = s.image(layer, 'story-guards-back', 300, TEXT_TOP - 10, 1.6);
    if (!guards) return;
    guards.setOrigin(0.5, 1);
    s.tweens.add({ targets: guards, x: 560, y: TEXT_TOP - 70, scale: 0.9, duration: 7000, ease: 'Sine.easeInOut' });
    s.tweens.add({ targets: guards, angle: { from: -2, to: 2 }, duration: 380, yoyo: true, repeat: -1 });
  },
};
