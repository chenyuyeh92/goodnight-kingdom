import { test, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { TUNES, isTrackId, levelTrack, tuneFor, worldTrack } from '../src/audio/tunes';
import { LEVELS } from '../src/levels';
import { SCENE_TIME } from '../src/art/scenes';

const DIR = 'public/assets/music/';
const tracks = JSON.parse(readFileSync(`${DIR}tracks.json`, 'utf8')) as Record<string, string>;

test('每個世界各一套曲目名稱:w01-day … w10-boss', () => {
  expect(worldTrack(1, 'day')).toBe('w01-day');
  expect(worldTrack(10, 'boss')).toBe('w10-boss');
  expect(isTrackId('w05-night')).toBe(true);
  expect(isTrackId('menu')).toBe(true);
  expect(isTrackId('w11-day')).toBe(false);
  expect(isTrackId('w05-noon')).toBe(false);
});

test('錄音檔載入失敗時,世界的曲子改用同時段的合成曲', () => {
  expect(tuneFor('w05-night')).toBe(TUNES.night);
  expect(tuneFor('w02-boss')).toBe(TUNES.boss);
  expect(tuneFor('menu')).toBe(TUNES.menu);
});

test('tracks.json 登記了十個世界的白天、黃昏、晚上、關主戰,檔案都在', () => {
  for (let w = 1; w <= 10; w++) {
    for (const time of ['day', 'dusk', 'night', 'boss'] as const) {
      const id = worldTrack(w, time);
      expect(tracks[id], id).toBeDefined();
      expect(existsSync(DIR + tracks[id]), tracks[id]).toBe(true);
    }
  }
  // 只有世界 1 有自己的關主戰曲;其他世界的關主戰用晚上那首。
  expect(tracks['w01-boss']).toBe('w01-boss.mp3');
  for (let w = 2; w <= 10; w++) expect(tracks[worldTrack(w, 'boss')]).toBe(tracks[worldTrack(w, 'night')]);
  // 主選單、選關、背包、守衛房間、設定、開場與結局都用美術組的 C 版「冒險前的晚安」。
  expect(tracks.menu).toBe('menu.mp3');
  expect(existsSync(DIR + tracks.menu)).toBe(true);
  for (const id of Object.keys(tracks)) expect(isTrackId(id), id).toBe(true);
});

test('每一關放自己世界、自己時段的曲子', () => {
  for (const [id, L] of Object.entries(LEVELS)) {
    expect(levelTrack(L.world, SCENE_TIME[L.scenes[0].scene]), id).toBe(worldTrack(L.world, SCENE_TIME[L.scenes[0].scene]));
  }
  expect(levelTrack(LEVELS['w3-2'].world, 'dusk')).toBe('w03-dusk');
});
