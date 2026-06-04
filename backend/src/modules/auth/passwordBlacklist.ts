// 密码黑名单（Top 100k）
// v4 §5.1：基础 Set<string> 实现，O(1) 查询
// 启动时一次性加载到内存，注册时检查密码是否命中
// ft 外延后（td-002）可优化为 Bloom filter / 分布式缓存

import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * 默认黑名单文件路径。
 * 优先读 BLACKLIST_PATH 环境变量；否则按以下顺序查找：
 *   1) backend/src/modules/auth/top100k-passwords.txt（开发）
 *   2) backend/dist/modules/auth/top100k-passwords.txt（构建后）
 * 3) backend/top100k-passwords.txt（兼容）
 */
function findDefaultBlacklistPath(): string {
  const candidates = [
    'src/modules/auth/top100k-passwords.txt',
    'dist/modules/auth/top100k-passwords.txt',
    'modules/auth/top100k-passwords.txt',
  ];
  for (const rel of candidates) {
    const abs = resolve(process.cwd(), rel);
    if (existsSync(abs)) return abs;
  }
  // 兜底
  return resolve(process.cwd(), candidates[0]);
}

export class PasswordBlacklist {
  private readonly set: Set<string> = new Set();
  private loaded = false;

  /**
   * 从 .txt 文件加载黑名单（每行一个密码）。
   * 文件不存在时降级为空 Set（不阻塞启动），由调用方记录告警。
   */
  load(customPath?: string): void {
    if (this.loaded) return;
    const path = customPath ?? process.env.BLACKLIST_PATH ?? findDefaultBlacklistPath();
    if (!existsSync(path)) {
      // eslint-disable-next-line no-console
      console.warn(`[passwordBlacklist] 黑名单文件不存在: ${path}，降级为不检查`);
      this.loaded = true;
      return;
    }
    const content = readFileSync(path, 'utf-8');
    let count = 0;
    for (const line of content.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (trimmed.length === 0 || trimmed.startsWith('#')) continue;
      this.set.add(trimmed.toLowerCase());
      count += 1;
    }
    this.loaded = true;
    // eslint-disable-next-line no-console
    console.log(`[passwordBlacklist] 已加载 ${count} 条黑密码`);
  }

  /** 命中黑名单返回 true。密码按小写比较。可选 path 用于测试加载失败降级。 */
  contains(password: string, customPath?: string): boolean {
    if (!this.loaded) this.load(customPath);
    return this.set.has(password.toLowerCase());
  }

  /** 黑名单条目数（供测试断言） */
  size(): number {
    return this.set.size;
  }

  /** 强制重新加载（测试用） */
  reset(): void {
    this.set.clear();
    this.loaded = false;
  }
}

export const passwordBlacklist = new PasswordBlacklist();
