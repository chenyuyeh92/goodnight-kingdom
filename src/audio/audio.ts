import type { StorageLike } from '../config/tuning';
import { noteFreq } from './notes';
import { SFX, THROTTLE_MS, type SfxName } from './recipes';
import { DEFAULT_SETTINGS, loadSettings, saveSettings, volumeGain, type AudioSettings } from './settings';
import { makeThrottle, voiceCap } from './throttle';
import { TUNES, type TrackId, type Tune } from './tunes';

/** 整體音量上限,避免合成音疊起來爆音。 */
const MASTER = 0.6;
/** 配樂比音效小聲一點,但在手機喇叭上也要聽得到。 */
const MUSIC_BASE = 1.4;
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
  /** 解碼過的錄音檔(換場景時不用重新下載、解碼)。 */
  private readonly buffers = new Map<string, AudioBuffer>();
  /** 每種音效被觸發幾次(測試用,靜音時也算)。 */
  readonly counts: Partial<Record<SfxName, number>> = {};
  /** 實際發出聲音的音效次數(測試用:靜音時應該是 0)。 */
  voicesStarted = 0;
  /** 正在響的音效數(到 MAX_VOICES 就不放新的)。 */
  private activeVoices = 0;
  /** 正在排程的配樂數(測試用:換場景後應該只剩 1)。 */
  activeSchedulers = 0;

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
    // iPhone/iPad 只認「手指放開」(touchend、pointerup、click)才算使用者手勢,按下時啟動聲音會一直是暫停狀態。
    const unlock = (): void => this.unlock();
    for (const ev of ['pointerdown', 'pointerup', 'touchend', 'click', 'keydown']) {
      window.addEventListener(ev, unlock, { capture: true });
    }
    document.addEventListener('visibilitychange', () => {
      if (!this.ctx) return;
      if (document.hidden) void this.ctx.suspend();
      else void this.ctx.resume();
    });
  }

  /** 第一次互動時建立聲音;不支援的瀏覽器就安靜地玩。 */
  unlock(): void {
    if (this.ctx) {
      // iOS 接電話、Siri 之後會變成 interrupted,也要重新啟動。
      if (this.ctx.state !== 'running' && !document.hidden) void this.ctx.resume().catch(() => undefined);
      return;
    }
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    try {
      this.ctx = new Ctx();
    } catch {
      return;
    }
    if (this.ctx.state !== 'running') void this.ctx.resume().catch(() => undefined);
    this.master = this.ctx.createGain();
    this.master.gain.value = MASTER;
    // 保險用的限幅器:很多聲音疊在一起時不會爆音。
    const limiter = this.ctx.createDynamicsCompressor();
    limiter.threshold.value = -6;
    limiter.ratio.value = 12;
    this.master.connect(limiter).connect(this.ctx.destination);
    this.musicBus = this.ctx.createGain();
    this.sfxBus = this.ctx.createGain();
    this.musicBus.gain.value = volumeGain(this.settings.music, this.settings.muted) * MUSIC_BASE;
    this.sfxBus.gain.value = volumeGain(this.settings.sfx, this.settings.muted);
    this.musicBus.connect(this.master);
    this.sfxBus.connect(this.master);
    this.applySettings();
    if (this.wantTrack) this.startTrack(this.wantTrack);
  }

  /** 設定畫面調音量時的試聽:用新的音量、不受頻率限制。 */
  preview(): void {
    const ctx = this.ctx;
    if (!ctx || ctx.state !== 'running' || volumeGain(this.settings.sfx, this.settings.muted) === 0) return;
    try {
      this.playTones('select', ctx, 1);
      this.voicesStarted++;
    } catch {
      // 同 sfx()。
    }
  }

  getSettings(): AudioSettings {
    return { ...this.settings };
  }

  setSettings(s: AudioSettings): void {
    this.settings = { ...s };
    saveSettings(this.storage, this.settings);
    this.applySettings();
  }

  /** pitch:音高倍數(豎琴每發不同音)。 */
  sfx(name: SfxName, pitch = 1): void {
    this.counts[name] = (this.counts[name] ?? 0) + 1;
    const ctx = this.ctx;
    // 先看聽不聽得到再算頻率限制,靜音時不會佔掉之後的那一次。
    if (!ctx || !this.sfxBus || ctx.state !== 'running' || volumeGain(this.settings.sfx, this.settings.muted) === 0) return;
    const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
    if (!voiceCap(this.activeVoices) || !this.throttle(name, now)) return;
    try {
      this.playTones(name, ctx, pitch);
      this.voicesStarted++;
    } catch {
      // 合成失敗(瀏覽器怪狀況)就安靜跳過,不影響遊戲。
    }
  }

  private playTones(name: SfxName, ctx: AudioContext, pitch: number): void {
    const t0 = ctx.currentTime;
    const tones = SFX[name];
    // 這個音效最後一個音停掉時,才算少一個正在響的聲音。
    const end = Math.max(...tones.map((t) => t.at + t.dur));
    this.activeVoices++;
    for (const tone of tones) {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = tone.wave;
      osc.frequency.setValueAtTime(tone.freq * pitch, t0 + tone.at);
      if (tone.toFreq) osc.frequency.exponentialRampToValueAtTime(tone.toFreq * pitch, t0 + tone.at + tone.dur);
      g.gain.setValueAtTime(0.0001, t0 + tone.at);
      g.gain.exponentialRampToValueAtTime(tone.gain, t0 + tone.at + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + tone.at + tone.dur);
      osc.connect(g).connect(this.sfxBus!);
      osc.start(t0 + tone.at);
      osc.stop(t0 + tone.at + tone.dur + 0.02);
      if (tone.at + tone.dur === end) osc.onended = () => (this.activeVoices = Math.max(0, this.activeVoices - 1));
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

  /** 錄音檔:解碼過的會留著重用;載入失敗就改用合成的音樂盒。 */
  private playRecorded(url: string, out: GainNode, fallback: Tune): () => void {
    const ctx = this.ctx!;
    let stopped = false;
    let source: AudioBufferSourceNode | null = null;
    let synthStop: (() => void) | null = null;
    const cached = this.buffers.get(url);
    const load = cached
      ? Promise.resolve(cached)
      : fetch(url)
          .then((r) => {
            if (!r.ok) throw new Error(`${r.status}`);
            return r.arrayBuffer();
          })
          .then((b) => ctx.decodeAudioData(b))
          .then((buf) => {
            this.buffers.set(url, buf);
            return buf;
          });
    void load
      .then((buf) => {
        if (stopped) return;
        source = ctx.createBufferSource();
        source.buffer = buf;
        source.loop = true;
        source.connect(out);
        // 解碼花比較久時,從真正開始播的時候淡入。
        out.gain.cancelScheduledValues(ctx.currentTime);
        out.gain.setValueAtTime(0, ctx.currentTime);
        out.gain.linearRampToValueAtTime(1, ctx.currentTime + FADE_S);
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
      // 主執行緒卡住太久時,跳過來不及的音,不要一次全部擠在一起播。
      if (next < ctx.currentTime) next = ctx.currentTime + 0.05;
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
    this.activeSchedulers++;
    return () => {
      clearInterval(timer);
      this.activeSchedulers--;
    };
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
