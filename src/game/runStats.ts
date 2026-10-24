import { pick, tr } from '../i18n/lang';
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
  return tr(`${min} 分 ${String(sec).padStart(2, '0')} 秒`, `${min}:${String(sec).padStart(2, '0')}`);
}

export function addWeapon(list: readonly SpecialWeaponId[], id: SpecialWeaponId): SpecialWeaponId[] {
  return list.includes(id) ? [...list] : [...list, id];
}

export function summaryLines(s: RunStats, endedAt: number): string[] {
  const weapons = s.weaponsGot.length > 0 ? s.weaponsGot.map((id) => pick(WEAPONS[id].name)).join(tr('、', ', ')) : tr('沒有', 'none');
  const time = formatDuration(endedAt - s.startedAt);
  return [
    tr(`通關時間 ${time}`, `Clear time ${time}`),
    tr(`哄睡魔物 ${s.defeated} 隻`, `Monsters lulled to sleep: ${s.defeated}`),
    ...((s.bestCombo ?? 0) >= 2 ? [tr(`最多連續哄睡 ${s.bestCombo} 隻`, `Best lullaby combo: ${s.bestCombo}`)] : []),
    tr(`找到寶箱 ${s.chestsFound} / ${s.chestsTotal}`, `Chests found ${s.chestsFound} / ${s.chestsTotal}`),
    ...(s.starsTotal ? [tr(`收集星星 ${s.starsFound ?? 0} / ${s.starsTotal}`, `Stars collected ${s.starsFound ?? 0} / ${s.starsTotal}`)] : []),
    tr(`這次拿到:${weapons}`, `Weapons this run: ${weapons}`),
    tr(`睡著重來 ${s.restarts} 次`, `Times fell asleep: ${s.restarts}`),
  ];
}
