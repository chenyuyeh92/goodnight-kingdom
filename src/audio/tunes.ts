/**
 * 配樂(程式合成的音樂盒):全部是公有領域的曲子。
 * - 布拉姆斯《搖籃曲》(1868,布拉姆斯 1897 年過世)
 * - 《小星星》(法國童謠,18 世紀)
 * - 《兩隻老虎/賈克修士》(法國童謠,18 世紀)
 * 每個音是 [音名或 null(休止), 拍數];bass 是每小節的低音。
 */
/** 合成音樂盒的曲子(全遊戲共用):主頁、白天、黃昏、晚上、關主戰。 */
export type BaseTrackId = 'menu' | 'day' | 'dusk' | 'night' | 'boss';
/** 錄好的配樂每個世界各一套:w01-day … w10-boss(關主戰在世界 2–10 用晚上那首,寫在 tracks.json)。 */
export type WorldTime = 'day' | 'dusk' | 'night' | 'boss';
export type WorldTrackId = `w${string}-${WorldTime}`;
export type TrackId = BaseTrackId | WorldTrackId;

export interface Tune {
  bpm: number;
  beatsPerBar: number;
  melody: readonly (readonly [string | null, number])[];
  bass: readonly string[];
  /** 弱起(開頭不完整小節)的拍數。 */
  pickup?: number;
}

const BRAHMS: Tune['melody'] = [
  ['E4', 0.5], ['E4', 0.5],
  ['G4', 1.5], ['E4', 0.5], ['E4', 1],
  ['G4', 2], ['E4', 0.5], ['G4', 0.5],
  ['C5', 1], ['B4', 1.5], ['A4', 0.5],
  ['A4', 1], ['G4', 1], ['D4', 0.5], ['E4', 0.5],
  ['F4', 1], ['D4', 1], ['D4', 0.5], ['E4', 0.5],
  ['F4', 2], ['D4', 0.5], ['F4', 0.5],
  ['B4', 0.5], ['A4', 0.5], ['G4', 1], ['B4', 1],
  // 最後一小節是 C5 兩拍,接回開頭一拍的弱起,剛好循環。
  ['C5', 2],
];

const TWINKLE: Tune['melody'] = [
  ['C5', 1], ['C5', 1], ['G5', 1], ['G5', 1], ['A5', 1], ['A5', 1], ['G5', 2],
  ['F5', 1], ['F5', 1], ['E5', 1], ['E5', 1], ['D5', 1], ['D5', 1], ['C5', 2],
  ['G5', 1], ['G5', 1], ['F5', 1], ['F5', 1], ['E5', 1], ['E5', 1], ['D5', 2],
  ['G5', 1], ['G5', 1], ['F5', 1], ['F5', 1], ['E5', 1], ['E5', 1], ['D5', 2],
];

const JACQUES: Tune['melody'] = [
  ['C5', 1], ['D5', 1], ['E5', 1], ['C5', 1],
  ['C5', 1], ['D5', 1], ['E5', 1], ['C5', 1],
  ['E5', 1], ['F5', 1], ['G5', 2],
  ['E5', 1], ['F5', 1], ['G5', 2],
  ['G5', 0.5], ['A5', 0.5], ['G5', 0.5], ['F5', 0.5], ['E5', 1], ['C5', 1],
  ['G5', 0.5], ['A5', 0.5], ['G5', 0.5], ['F5', 0.5], ['E5', 1], ['C5', 1],
  ['C5', 1], ['G4', 1], ['C5', 2],
  ['C5', 1], ['G4', 1], ['C5', 2],
];

/** 關主戰:《賈克修士》改成小調(馬勒第一號交響曲第三樂章也用過小調版),再加快速度。 */
const JACQUES_MINOR = JACQUES.map(([note, beats]) => [note?.replace(/^E/, 'Eb').replace(/^A/, 'Ab') ?? null, beats] as const);

export const TUNES: Record<BaseTrackId, Tune> = {
  menu: { bpm: 84, beatsPerBar: 3, pickup: 1, melody: BRAHMS, bass: ['C3', 'C3', 'G2', 'G2', 'G2', 'G2', 'G2', 'C3'] },
  day: { bpm: 112, beatsPerBar: 4, melody: JACQUES, bass: ['C3', 'C3', 'C3', 'C3', 'C3', 'C3', 'C3', 'C3'] },
  dusk: { bpm: 72, beatsPerBar: 3, pickup: 1, melody: BRAHMS, bass: ['C3', 'C3', 'G2', 'G2', 'G2', 'G2', 'G2', 'C3'] },
  night: { bpm: 76, beatsPerBar: 4, melody: TWINKLE, bass: ['C3', 'F2', 'C3', 'C3', 'C3', 'G2', 'C3', 'G2'] },
  boss: { bpm: 150, beatsPerBar: 4, melody: JACQUES_MINOR, bass: ['C3', 'C3', 'C3', 'C3', 'C3', 'G2', 'C3', 'C3'] },
};

export function tuneBeats(t: Tune): number {
  return t.melody.reduce((s, [, b]) => s + b, 0);
}

const WORLD_TRACK = /^w(0[1-9]|10)-(day|dusk|night|boss)$/;

export function worldTrack(world: number, time: WorldTime): WorldTrackId {
  return `w${String(world).padStart(2, '0')}-${time}`;
}

export function isTrackId(id: string): id is TrackId {
  return id in TUNES || WORLD_TRACK.test(id);
}

/** 錄音檔載入失敗或沒有登記時改播的合成曲:世界的曲子用同時段的。 */
export function tuneFor(id: TrackId): Tune {
  if (id in TUNES) return TUNES[id as BaseTrackId];
  return TUNES[id.slice(id.indexOf('-') + 1) as WorldTime];
}

/** 這一關的配樂:自己世界、自己時段(第一個場景的白天/黃昏/晚上)。 */
export function levelTrack(world: number, time: Exclude<WorldTime, 'boss'>): WorldTrackId {
  return worldTrack(world, time);
}
