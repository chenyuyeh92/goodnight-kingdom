import type { StorageLike } from '../config/tuning';
import { noteFreq } from './notes';
import { SFX, type SfxName } from './recipes';
import { DEFAULT_SETTINGS, loadSettings, saveSettings, volumeGain, type AudioSettings } from './settings';
import { makeThrottle } from './throttle';
import { TUNES, type TrackId, type Tune } from './tunes';

/** 同一種音效最短的間隔(ms):連射與一次打倒很多隻時不會吵成一片。 */
const THROTTLE_MS: Partial<Record<SfxName, number>> = { shoot: 90, hit: 50, blocked: 80, sleep: 70, splash: 200, select: 40 };
/** 整體音量上限,避免合成音疊起來爆音。 */
const MASTER = 0.6;
const MUSIC_BASE = 0.5;
const FADE_S = 0.6;
const LOOKAHEAD_S = 0.3;
const SCHEDULE_MS = 60;

interface Playing {
  id: TrackId;
  gain: GainNode;
  stop(): void;
}

/**
 * 全遊戲的聲音:音效即時合成,配樂是合成的音樂盒(或 public/assets/music/ 裡登記的錄音檔)。
 * 瀏覽器要求使用者先互動才能出聲,所以第一次點擊或按鍵時才建立 AudioContext。
 */
class AudioManager {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private musicBus: GainNode | null = null;
  private sfxBus: GainNode | null = null;
  private storage: StorageLike | null = null;
  private settings: AudioSettings = { ...DEFAULT_SETTINGS };
  private wantTrack: TrackId | null = null;
  private playing: Playing | null = null;
  private recorded: Partial<Record<TrackId, string>> = {};
  private readonly throttle = makeThrottle(THROTTLE_MS);
  /** 每種音效被觸發幾次(測試用,靜音時也算)。 */
  readonly counts: Partial<Record<SfxName, number>> = {};

  init(storage: StorageLike | null, recordedTracksUrl: string): void {
    this.storage = storage;
    this.settings = loadSettings(storage);
    void fetch(recordedTracksUrl)
      .then((r) => (r.ok ? r.json() : {}))
      .then((json: unknown) => {
        if (typeof json !== 'object' || json === null) return;
        const base = recordedTracksUrl.replace(/[^/]*$/, '');
        for (const [id, file] of Object.entries(json as Record<string, unknown>)) {
          if (id in TUNES && typeof file === 'string' && /^[\w.-]+$/.test(file)) this.recorded[id as TrackId] = base + file;
        }
      })
      .catch(() => undefined);
    const unlock = (): void => this.unlock();
    window.addEventListener('pointerdown', unlock);
    window.addEventListener('keydown', unlock);
    document.addEventListener('visibilitychange', () => {
      if (!this.ctx) return;
      if (document.hidden) void this.ctx.suspend();
      else void this.ctx.resume();
    });
  }

  /** 第一次互動時建立聲音;不支援的瀏覽器就安靜地玩。 */
  unlock(): void {
    if (this.ctx) {
      if (this.ctx.state === 'suspended' && !document.hidden) void this.ctx.resume();
      return;
    }
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    try {
      this.ctx = new Ctx();
    } catch {
      return;
    }
    this.master = this.ctx.createGain();
    this.master.gain.value = MASTER;
    this.master.connect(this.ctx.destination);
    this.musicBus = this.ctx.createGain();
    this.sfxBus = this.ctx.createGain();
    this.musicBus.connect(this.master);
    this.sfxBus.connect(this.master);
    this.applySettings();
    if (this.wantTrack) this.startTrack(this.wantTrack);
  }

  getSettings(): AudioSettings {
    return { ...this.settings };
  }

  setSettings(s: AudioSettings): void {
    this.settings = { ...s };
    saveSettings(this.storage, this.settings);
    this.applySettings();
  }

  sfx(name: SfxName): void {
    const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
    if (!this.throttle(name, now)) return;
    this.counts[name] = (this.counts[name] ?? 0) + 1;
    const ctx = this.ctx;
    if (!ctx || !this.sfxBus || ctx.state !== 'running' || volumeGain(this.settings.sfx, this.settings.muted) === 0) return;
    const t0 = ctx.currentTime;
    for (const tone of SFX[name]) {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = tone.wave;
      osc.frequency.setValueAtTime(tone.freq, t0 + tone.at);
      if (tone.toFreq) osc.frequency.exponentialRampToValueAtTime(tone.toFreq, t0 + tone.at + tone.dur);
      g.gain.setValueAtTime(0.0001, t0 + tone.at);
      g.gain.exponentialRampToValueAtTime(tone.gain, t0 + tone.at + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + tone.at + tone.dur);
      osc.connect(g).connect(this.sfxBus);
      osc.start(t0 + tone.at);
      osc.stop(t0 + tone.at + tone.dur + 0.02);
    }
  }

  /** 換配樂;同一首就繼續播。null 是停止。 */
  music(id: TrackId | null): void {
    if (id === this.wantTrack) return;
    this.wantTrack = id;
    this.fadeOutCurrent();
    if (id && this.ctx) this.startTrack(id);
  }

  currentTrack(): TrackId | null {
    return this.wantTrack;
  }

  private applySettings(): void {
    const ctx = this.ctx;
    if (!ctx || !this.musicBus || !this.sfxBus) return;
    this.musicBus.gain.setTargetAtTime(volumeGain(this.settings.music, this.settings.muted) * MUSIC_BASE, ctx.currentTime, 0.05);
    this.sfxBus.gain.setTargetAtTime(volumeGain(this.settings.sfx, this.settings.muted), ctx.currentTime, 0.05);
  }

  private fadeOutCurrent(): void {
    const p = this.playing;
    this.playing = null;
    if (!p || !this.ctx) return;
    const t = this.ctx.currentTime;
    p.gain.gain.cancelScheduledValues(t);
    p.gain.gain.setValueAtTime(p.gain.gain.value, t);
    p.gain.gain.linearRampToValueAtTime(0, t + FADE_S);
    setTimeout(() => {
      p.stop();
      p.gain.disconnect();
    }, FADE_S * 1000 + 50);
  }

  private startTrack(id: TrackId): void {
    const ctx = this.ctx!;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(1, ctx.currentTime + FADE_S);
    gain.connect(this.musicBus!);
    const url = this.recorded[id];
    const stop = url ? this.playRecorded(url, gain, TUNES[id]) : this.playSynth(TUNES[id], gain);
    this.playing = { id, gain, stop };
  }

  /** 錄音檔:載入失敗就改用合成的音樂盒。 */
  private playRecorded(url: string, out: GainNode, fallback: Tune): () => void {
    const ctx = this.ctx!;
    let stopped = false;
    let source: AudioBufferSourceNode | null = null;
    let synthStop: (() => void) | null = null;
    void fetch(url)
      .then((r) => r.arrayBuffer())
      .then((b) => ctx.decodeAudioData(b))
      .then((buf) => {
        if (stopped) return;
        source = ctx.createBufferSource();
        source.buffer = buf;
        source.loop = true;
        source.connect(out);
        source.start();
      })
      .catch(() => {
        if (!stopped) synthStop = this.playSynth(fallback, out);
      });
    return () => {
      stopped = true;
      source?.stop();
      synthStop?.();
    };
  }

  /** 合成的音樂盒:旋律是三角波加八度泛音、很快衰減;每小節一個柔和的低音。 */
  private playSynth(tune: Tune, out: GainNode): () => void {
    const ctx = this.ctx!;
    const beat = 60 / tune.bpm;
    let next = ctx.currentTime + 0.1;
    let i = 0;
    // 有弱起的曲子,第一個低音在第一個正拍才出現。
    let barBeat = tune.pickup ? tune.beatsPerBar - tune.pickup : 0;
    let bar = 0;
    const schedule = (): void => {
      while (next < ctx.currentTime + LOOKAHEAD_S) {
        const [note, beats] = tune.melody[i];
        if (barBeat === 0 || barBeat >= tune.beatsPerBar - 1e-6) {
          barBeat = 0;
          this.tone(out, noteFreq(tune.bass[bar % tune.bass.length]), next, beat * tune.beatsPerBar, 'sine', 0.12, 0.05);
          bar++;
        }
        if (note) {
          const f = noteFreq(note);
          this.tone(out, f, next, Math.min(beat * beats * 1.6, 1.4), 'triangle', 0.22, 0.004);
          this.tone(out, f * 2, next, Math.min(beat * beats, 0.6), 'sine', 0.05, 0.004);
        }
        next += beat * beats;
        barBeat += beats;
        i = (i + 1) % tune.melody.length;
        if (i === 0) bar = 0;
      }
    };
    schedule();
    const timer = setInterval(schedule, SCHEDULE_MS);
    return () => clearInterval(timer);
  }

  private tone(out: AudioNode, freq: number, at: number, dur: number, wave: OscillatorType, peak: number, attack: number): void {
    const ctx = this.ctx!;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = wave;
    osc.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, at);
    g.gain.exponentialRampToValueAtTime(peak, at + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    osc.connect(g).connect(out);
    osc.start(at);
    osc.stop(at + dur + 0.05);
  }
}

export const audio = new AudioManager();
