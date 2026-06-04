// 5 分钟注册幂等键（缓存层 / DB unique 约束双保险）
// v4 §US-001 AC4：5 分钟内同邮箱重复注册返回与首次完全相同的响应
// 设计中：缓存层用 in-memory Map，DB 层由 User.email UNIQUE 约束兜底

interface IdempotencyEntry<T> {
  expiresAt: number;
  value: T;
}

/**
 * 进程内幂等键存储（MVP）。
 * 后续 ft 外延后（td-002）迁移到 Redis 实现跨进程共享。
 */
export class IdempotencyStore<T> {
  private readonly store = new Map<string, IdempotencyEntry<T>>();

  constructor(private readonly ttlMs: number = 5 * 60 * 1000) {}

  /** 取值，过期则删除并返回 undefined */
  get(key: string): T | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (entry.expiresAt < Date.now()) {
      this.store.delete(key);
      return undefined;
    }
    return entry.value;
  }

  /** 写入；TTL 由构造时指定。key 已存在则覆盖。 */
  set(key: string, value: T): void {
    this.store.set(key, { value, expiresAt: Date.now() + this.ttlMs });
  }

  /** 主动删除（用于回滚场景） */
  delete(key: string): void {
    this.store.delete(key);
  }

  /** 清空全部（仅供测试使用） */
  clear(): void {
    this.store.clear();
  }
}
