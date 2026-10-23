import { WEAPONS, type SpecialWeaponId } from './weapons';

/** 一次遊玩(含睡著重來)的統計,通關時顯示。 */
export interface RunStats {
  startedAt: number;
  defeated: number;
  chestsFound: number;
  chestsTotal: number;
  weaponsGot: SpecialWeaponId[];
  restarts: number;
  /** 收集的星星(世界 10 才有)。 */
  starsFound?: number;
  starsTotal?: number;
  /** 最多連續哄睡幾隻(2 秒內接連打倒)。 */
  bestCombo?: number;
}

export function newRunStats(startedAt: number, chestsTotal: number): RunStats {
  return { startedAt, defeated: 0, chestsFound: 0, chestsTotal, weaponsGot: [], restarts: 0 };
}

/** 65_000 → '1 分 05 秒'。 */
export function formatDuration(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const min = Math.floor(total / 60);
  const sec = total % 60;
  return `${min} 分 ${String(sec).padStart(2, '0')} 秒`;
}

export function addWeapon(list: readonly SpecialWeaponId[], id: SpecialWeaponId): SpecialWeaponId[] {
  return list.includes(id) ? [...list] : [...list, id];
}

export function summaryLines(s: RunStats, endedAt: number): string[] {
  const weapons = s.weaponsGot.length > 0 ? s.weaponsGot.map((id) => WEAPONS[id].name).join('、') : '沒有';
  return [
    `通關時間 ${formatDuration(endedAt - s.startedAt)}`,
    `哄睡魔物 ${s.defeated} 隻`,
    ...((s.bestCombo ?? 0) >= 2 ? [`最多連續哄睡 ${s.bestCombo} 隻`] : []),
    `找到寶箱 ${s.chestsFound} / ${s.chestsTotal}`,
    ...(s.starsTotal ? [`收集星星 ${s.starsFound ?? 0} / ${s.starsTotal}`] : []),
    `這次拿到:${weapons}`,
    `睡著重來 ${s.restarts} 次`,
  ];
}
