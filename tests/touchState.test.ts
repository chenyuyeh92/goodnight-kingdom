import { test, expect } from 'vitest';
import { TouchState, joystickIntent } from '../src/input/touchState';

const none = { left: false, right: false, up: false, down: false };

test('死區內不動', () => {
  expect(joystickIntent(8, -8)).toEqual(none);
});

test('往右', () => {
  expect(joystickIntent(30, 0)).toEqual({ ...none, right: true });
});

test('往右上同時成立', () => {
  expect(joystickIntent(30, -40)).toEqual({ ...none, right: true, up: true });
});

test('往下蹲', () => {
  expect(joystickIntent(0, 40)).toEqual({ ...none, down: true });
});

test('水平 16 以內不算左右', () => {
  expect(joystickIntent(16, -40)).toEqual({ ...none, up: true });
});

test('搖桿手指拖曳產生方向', () => {
  const t = new TouchState();
  t.down(1, 'stick', 100, 300);
  t.move(1, 140, 300);
  expect(t.intent().right).toBe(true);
});

test('放開搖桿手指歸零', () => {
  const t = new TouchState();
  t.down(1, 'stick', 100, 300);
  t.move(1, 140, 300);
  t.up(1);
  expect(t.intent().right).toBe(false);
  expect(t.stick()).toBeNull();
});

test('第二隻搖桿手指被忽略', () => {
  const t = new TouchState();
  t.down(1, 'stick', 100, 300);
  t.down(2, 'stick', 200, 300);
  t.move(2, 260, 300);
  expect(t.stick()!.originX).toBe(100);
  expect(t.intent().right).toBe(false);
});

test('搖桿手指滑到右邊仍是搖桿,不會變成射擊', () => {
  const t = new TouchState();
  t.down(1, 'stick', 100, 300);
  t.move(1, 700, 300);
  expect(t.intent().shoot).toBe(false);
  expect(t.intent().right).toBe(true);
});

test('射擊與跳躍可以和搖桿同時按', () => {
  const t = new TouchState();
  t.down(1, 'stick', 100, 300);
  t.move(1, 140, 300);
  t.down(2, 'shoot', 700, 300);
  t.down(3, 'jump', 800, 320);
  const i = t.intent();
  expect([i.right, i.shoot, i.jump]).toEqual([true, true, true]);
});

test('放開射擊手指後 shoot 為 false,其他不受影響', () => {
  const t = new TouchState();
  t.down(1, 'stick', 100, 300);
  t.move(1, 140, 300);
  t.down(2, 'shoot', 700, 300);
  t.up(2);
  expect(t.intent().shoot).toBe(false);
  expect(t.intent().right).toBe(true);
});

test('clear 全部歸零', () => {
  const t = new TouchState();
  t.down(1, 'stick', 100, 300);
  t.move(1, 140, 300);
  t.down(2, 'jump', 800, 320);
  t.clear();
  expect(t.intent()).toEqual({ ...none, jump: false, shoot: false });
});
