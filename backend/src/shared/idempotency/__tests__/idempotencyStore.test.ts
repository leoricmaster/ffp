// IdempotencyStore 单元测试
// v4 §US-001 AC4：5min 内同 key 返回相同结果

import { IdempotencyStore } from '../idempotencyStore';

describe('IdempotencyStore', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('set 后 get 返回值', () => {
    const store = new IdempotencyStore<{ ok: boolean }>(1000);
    store.set('k1', { ok: true });
    expect(store.get('k1')).toEqual({ ok: true });
  });

  test('TTL 过期后 get 返回 undefined', () => {
    const store = new IdempotencyStore<{ ok: boolean }>(1000);
    store.set('k1', { ok: true });
    jest.advanceTimersByTime(1500);
    expect(store.get('k1')).toBeUndefined();
  });

  test('TTL 内重复 get 仍返回原值', () => {
    const store = new IdempotencyStore<{ v: number }>(5000);
    store.set('k1', { v: 1 });
    jest.advanceTimersByTime(2000);
    expect(store.get('k1')).toEqual({ v: 1 });
    jest.advanceTimersByTime(2000);
    expect(store.get('k1')).toEqual({ v: 1 });
  });

  test('delete 主动失效', () => {
    const store = new IdempotencyStore<{ v: number }>(5000);
    store.set('k1', { v: 1 });
    store.delete('k1');
    expect(store.get('k1')).toBeUndefined();
  });

  test('clear 清空全部', () => {
    const store = new IdempotencyStore<{ v: number }>(5000);
    store.set('a', { v: 1 });
    store.set('b', { v: 2 });
    store.clear();
    expect(store.get('a')).toBeUndefined();
    expect(store.get('b')).toBeUndefined();
  });
});
