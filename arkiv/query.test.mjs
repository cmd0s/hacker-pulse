import { render } from '@arkiv-network/sdk/query';
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  stationQuery,
  presenceQuery,
  presenceInput,
  presenceFor,
  stationInput,
} from './model.ts';
const station = {
  stationId: 'desk-1',
  owner: '0xAB',
  key: 'station',
  expiresAt: '1000',
};
test('a lease from a different writer cannot make a station available', () => {
  assert.equal(
    presenceFor(station, [{ ...station, key: 'spoof', owner: '0xcd' }]),
    undefined,
  );
});
test('a missing lease changes state, without deleting the station', () => {
  const lease = {
    ...station,
    key: 'presence',
    owner: '0xab',
    expiresAt: '120',
  };
  assert.equal(presenceFor(station, [lease]), lease);
  assert.equal(presenceFor(station, []), undefined);
  assert.equal(station.key, 'station');
});
test('reannouncement uses the latest lease, regardless of result order', () => {
  const a = { ...station, key: 'old', expiresAt: '120' },
    b = { ...station, key: 'new', expiresAt: '140' };
  assert.equal(presenceFor(station, [a, b]), b);
  assert.equal(presenceFor(station, [b, a]), b);
});
test('both real query expressions carry namespace, run, type and a typed numeric condition', () => {
  for (const q of [stationQuery(), presenceQuery()]) {
    assert.match(render(q), /app = str\('hacker-pulse-ethrome-v1'\)/);
    assert.match(render(q), /seats >= u64\(1\)/);
    assert.match(render(q), /run = str/);
  }
});
test('run strings are escaped by SDK expression rendering', () => {
  const q = render(presenceQuery("x' OR kind = 'station"));
  assert(q.includes("run = str('x'' OR kind = ''station')"));
});
test('payload writers use only network-compatible lowercase attribute names', () => {
  for (const data of [stationInput('desk'), presenceInput('desk')])
    for (const key of Object.keys(data.attributes))
      assert.match(key, /^[a-z][a-z0-9_]*$/);
});
test('invalid lifetimes are rejected before submitting a transaction', () => {
  for (const n of [0, -1, 1.5, 61, NaN])
    assert.throws(() => presenceInput('desk', n));
});
