import test from 'node:test';
import assert from 'node:assert/strict';
import { ProfileStore } from '../src/core/profile-store.js';
import { dailyBeanStatus } from '../src/core/economy.js';
const now = Date.parse('2026-09-05T12:00:00Z');
test('daily collection survives reload and spending; next UTC day replenishes only quota', () => {
  let raw;
  const storage = { getItem: () => raw, setItem: (_, value) => { raw = value; } };
  let store = new ProfileStore(storage);
  for (let i = 0; i < 1000; i++) assert.equal(store.collectDailyBean(now), 1);
  assert.equal(store.collectDailyBean(now), 0);
  store.update(d => { d.beans = 0; });
  store = new ProfileStore(storage);
  assert.equal(store.collectDailyBean(now), 0);
  assert.equal(store.collectDailyBean(now - 86400000), 0);
  assert.equal(store.collectDailyBean(now + 86400000), 1);
  assert.equal(store.profile.beans, 1);
});
test('winnings do not consume tap quota and invalid counters cannot increase it', () => {
  const store = new ProfileStore(null);
  store.update(d => { d.beans += 2000; });
  assert.equal(store.collectDailyBean(now), 1);
  assert.equal(dailyBeanStatus(store.profile.dailyBeans, now).remaining, 999);
  assert.equal(dailyBeanStatus({day:'2026-09-05', claimed:-1}, now).remaining, 0);
  assert.throws(() => dailyBeanStatus(null, NaN), RangeError);
});
