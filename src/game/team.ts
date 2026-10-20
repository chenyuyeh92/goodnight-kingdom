import { RESTART_DELAY_MS, REVIVE_DELAY_MS, type Health } from './health';

export type TeamAction = { kind: 'none' } | { kind: 'revive'; index: number } | { kind: 'restart' };

/** 全部睡著就重來;還有人醒著時,睡夠久的人在隊友身邊復活。 */
export function decideTeam(healths: readonly Health[]): TeamAction {
  if (healths.every((h) => h.down)) {
    return healths.every((h) => h.downMs >= RESTART_DELAY_MS) ? { kind: 'restart' } : { kind: 'none' };
  }
  const index = healths.findIndex((h) => h.down && h.downMs >= REVIVE_DELAY_MS);
  return index >= 0 ? { kind: 'revive', index } : { kind: 'none' };
}

/** 到達過的最後一個檢查點;一個都沒到過時用第一個。 */
export function reachedCheckpoint(checkpoints: readonly number[], maxReachedX: number): number {
  let result = checkpoints[0];
  for (const cp of checkpoints) if (cp <= maxReachedX) result = cp;
  return result;
}
