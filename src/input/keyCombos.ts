import { PLAYER_A_KEYS, PLAYER_B_KEYS, type KeyBinding } from './keyBindings';

export interface KeyCombo {
  group: string;
  name: string;
  codes: readonly string[];
}

const LABELS: Record<string, string> = {
  ArrowLeft: '←',
  ArrowRight: '→',
  ArrowUp: '↑',
  ArrowDown: '↓',
  Comma: ',',
  Period: '.',
};

const CURRENT = '目前的按鍵配置';

function playerCombos(who: string, k: KeyBinding): KeyCombo[] {
  return [
    { group: CURRENT, name: `${who}:右 + 射擊 + 跳躍`, codes: [k.right, k.shoot, k.jump] },
    { group: CURRENT, name: `${who}:左 + 射擊 + 跳躍`, codes: [k.left, k.shoot, k.jump] },
    { group: CURRENT, name: `${who}:右 + 上 + 射擊`, codes: [k.right, k.up, k.shoot] },
    { group: CURRENT, name: `${who}:右 + 下 + 射擊`, codes: [k.right, k.down, k.shoot] },
    { group: CURRENT, name: `${who}:右 + 上 + 射擊 + 跳躍`, codes: [k.right, k.up, k.shoot, k.jump] },
  ];
}

/** 玩家 A 的射擊與跳躍候選鍵(F G 在部分筆電上和 A D 同按會漏鍵)。 */
const PLAYER_A_CANDIDATES: ReadonlyArray<[shoot: string, jump: string]> = [
  ['KeyJ', 'KeyK'],
  ['KeyV', 'KeyB'],
  ['KeyC', 'KeyV'],
  ['KeyH', 'KeyJ'],
];

function candidateCombos([shoot, jump]: [string, string]): KeyCombo[] {
  const a = PLAYER_A_KEYS;
  const b = PLAYER_B_KEYS;
  const label = `${keyLabel(shoot)} ${keyLabel(jump)}`;
  const group = `候選:射擊與跳躍改用 ${label}`;
  return [
    { group, name: `${label}|右 + 射擊 + 跳躍`, codes: [a.right, shoot, jump] },
    { group, name: `${label}|左 + 射擊 + 跳躍`, codes: [a.left, shoot, jump] },
    { group, name: `${label}|右 + 上 + 射擊 + 跳躍`, codes: [a.right, a.up, shoot, jump] },
    { group, name: `${label}|兩人同時:各自 右 + 射擊 + 跳躍`, codes: [a.right, shoot, jump, b.right, b.shoot, b.jump] },
  ];
}

/** 遊戲中常同時按住的組合,用來找出鍵盤硬體會漏掉的按鍵。 */
export const KEY_COMBOS: readonly KeyCombo[] = [
  ...playerCombos('玩家 A', PLAYER_A_KEYS),
  ...playerCombos('玩家 B', PLAYER_B_KEYS),
  {
    group: CURRENT,
    name: '兩人同時:各自 右 + 射擊 + 跳躍',
    codes: [PLAYER_A_KEYS.right, PLAYER_A_KEYS.shoot, PLAYER_A_KEYS.jump, PLAYER_B_KEYS.right, PLAYER_B_KEYS.shoot, PLAYER_B_KEYS.jump],
  },
  ...PLAYER_A_CANDIDATES.flatMap(candidateCombos),
];

/** 把目前全部按住的組合記為成功過。 */
export function markSeen(seen: Set<string>, pressed: ReadonlySet<string>): void {
  for (const combo of KEY_COMBOS) {
    if (combo.codes.every((c) => pressed.has(c))) seen.add(combo.name);
  }
}


export function keyLabel(code: string): string {
  if (LABELS[code]) return LABELS[code];
  if (/^Key[A-Z]$/.test(code)) return code.slice(3);
  return code;
}
