/** 同一種聲音在 minMs 內只放一次(連射武器不會吵成一片)。 */
export function makeThrottle(minMs: Partial<Record<string, number>>): (name: string, nowMs: number) => boolean {
  const last = new Map<string, number>();
  return (name, nowMs) => {
    const gap = minMs[name] ?? 0;
    const prev = last.get(name);
    if (prev !== undefined && nowMs - prev < gap) return false;
    last.set(name, nowMs);
    return true;
  };
}
