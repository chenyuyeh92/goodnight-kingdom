import { test, expect } from 'vitest';
import { EMPTY_INTENT, type Intent } from '../src/input/intent';
import { DEFAULT_TUNING } from '../src/config/tuning';
import { initialMotorState, stepMotor, type MotorInput, type MotorOutput, type MotorState } from '../src/game/playerMotor';

function run(
  intent: Partial<Intent>,
  opts: Partial<Omit<MotorInput, 'intent'>> = {},
  s: MotorState = initialMotorState(),
): MotorOutput {
  return stepMotor(
    s,
    { intent: { ...EMPTY_INTENT, ...intent }, grounded: true, canStand: true, dtMs: 16, ...opts },
    DEFAULT_TUNING,
  );
}

test('按右 → 走路速度,面向 1', () => {
  const o = run({ right: true });
  expect(o.vx).toBe(DEFAULT_TUNING.walkSpeed);
  expect(o.state.facing).toBe(1);
});

test('按左 → 負的走路速度,面向 -1', () => {
  const o = run({ left: true });
  expect(o.vx).toBe(-DEFAULT_TUNING.walkSpeed);
  expect(o.state.facing).toBe(-1);
});

test('放開 → vx 0,面向不變', () => {
  const o = run({}, {}, run({ left: true }).state);
  expect(o.vx).toBe(0);
  expect(o.state.facing).toBe(-1);
});

test('左右同時 → vx 0,面向不變', () => {
  const o = run({ left: true, right: true });
  expect(o.vx).toBe(0);
  expect(o.state.facing).toBe(1);
});

test('空中按右 → 空中速度', () => {
  expect(run({ right: true }, { grounded: false }).vx).toBe(DEFAULT_TUNING.airSpeed);
});

test('在地上按跳 → 起跳', () => {
  expect(run({ jump: true }).jumpVy).toBe(-DEFAULT_TUNING.jumpVelocity);
});

test('按住跳不會連跳', () => {
  const first = run({ jump: true });
  expect(run({ jump: true }, {}, first.state).jumpVy).toBeNull();
});

test('離開平台 100ms 內仍可起跳', () => {
  let s = run({}).state;
  s = run({}, { grounded: false, dtMs: 50 }, s).state;
  expect(run({ jump: true }, { grounded: false, dtMs: 40 }, s).jumpVy).toBe(-DEFAULT_TUNING.jumpVelocity);
});

test('離開平台超過 100ms 不可起跳', () => {
  let s = run({}).state;
  s = run({}, { grounded: false, dtMs: 50 }, s).state;
  s = run({}, { grounded: false, dtMs: 50 }, s).state;
  expect(run({ jump: true }, { grounded: false, dtMs: 16 }, s).jumpVy).toBeNull();
});

test('落地前提早按跳,落地時起跳', () => {
  const air = run({ jump: true }, { grounded: false });
  expect(air.jumpVy).toBeNull();
  expect(run({}, { grounded: true, dtMs: 50 }, air.state).jumpVy).toBe(-DEFAULT_TUNING.jumpVelocity);
});

test('超大 dtMs 被限制為 50', () => {
  let s = run({}).state;
  s = run({}, { grounded: false, dtMs: 5000 }, s).state;
  expect(run({ jump: true }, { grounded: false, dtMs: 16 }, s).jumpVy).toBe(-DEFAULT_TUNING.jumpVelocity);
});

test('在地上按下 → 蹲下,用爬行速度,瞄準 forward', () => {
  const o = run({ down: true, right: true });
  expect(o.state.crouching).toBe(true);
  expect(o.vx).toBe(DEFAULT_TUNING.crawlSpeed);
  expect(o.state.aim).toBe('forward');
});

test('上下同按 → 不蹲、瞄準 forward', () => {
  const o = run({ up: true, down: true });
  expect(o.state.crouching).toBe(false);
  expect(o.state.aim).toBe('forward');
});

test('按上 → 瞄準 up', () => {
  expect(run({ up: true }).state.aim).toBe('up');
});

test('空中按下 → 瞄準 down 且不蹲', () => {
  const o = run({ down: true }, { grounded: false });
  expect(o.state.aim).toBe('down');
  expect(o.state.crouching).toBe(false);
});

test('低矮處放開下 → 維持蹲下', () => {
  const crouched = run({ down: true }).state;
  expect(run({}, { canStand: false }, crouched).state.crouching).toBe(true);
});

test('低矮處不能起跳', () => {
  const crouched = run({ down: true }).state;
  expect(run({ jump: true }, { canStand: false }, crouched).jumpVy).toBeNull();
});

test('蹲著且上方有空間時按跳 → 起跳並站起', () => {
  const crouched = run({ down: true }).state;
  const o = run({ down: true, jump: true }, { canStand: true }, crouched);
  expect(o.jumpVy).toBe(-DEFAULT_TUNING.jumpVelocity);
  expect(o.state.crouching).toBe(false);
});
