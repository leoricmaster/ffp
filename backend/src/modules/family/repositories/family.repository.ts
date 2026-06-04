// Family + FamilyMember + TransactionCategory 仓储层
// v4 §6.1：默认家庭字段固定
//   name = "我的家庭"
//   currency = "CNY"
//   timezone = "Asia/Shanghai"
//   language = "zh-CN"
//   status = "active"

import { v4 as uuidv4 } from 'uuid';
import { db } from '../../../shared/database';
import type { Family, FamilyMember, TransactionCategory } from '../../../shared/types';
import { ALL_DEFAULT_CATEGORIES } from '../defaultCategories';

export const DEFAULT_FAMILY = {
  name: '我的家庭',
  currency: 'CNY',
  timezone: 'Asia/Shanghai',
  language: 'zh-CN',
  status: 'active' as const,
};

export const DEFAULT_MEMBER = {
  role: 'ADMIN' as const,
  status: 'active',
};

export class FamilyRepository {
  createFamily(now: Date = new Date()): Family {
    const family: Family = {
      id: uuidv4(),
      name: DEFAULT_FAMILY.name,
      description: null,
      avatar: null,
      currency: DEFAULT_FAMILY.currency,
      timezone: DEFAULT_FAMILY.timezone,
      language: DEFAULT_FAMILY.language,
      status: DEFAULT_FAMILY.status,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    };
    db.families.set(family.id, family);
    return family;
  }

  createFamilyMember(userId: string, familyId: string, now: Date = new Date()): FamilyMember {
    const fm: FamilyMember = {
      id: uuidv4(),
      userId,
      familyId,
      role: DEFAULT_MEMBER.role,
      status: DEFAULT_MEMBER.status,
      joinedAt: now,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    };
    db.familyMembers.set(fm.id, fm);
    return fm;
  }

  /** 批量插入 14 条默认分类到指定家庭。返回插入数量。 */
  createDefaultCategories(familyId: string, now: Date = new Date()): TransactionCategory[] {
    const categories: TransactionCategory[] = ALL_DEFAULT_CATEGORIES.map((seed) => ({
      id: uuidv4(),
      familyId,
      name: seed.name,
      type: seed.type,
      icon: null,
      color: null,
      parentId: null,
      sortOrder: seed.sortOrder,
      systemDefault: true,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    }));
    for (const c of categories) {
      db.transactionCategories.set(c.id, c);
    }
    return categories;
  }

  /**
   * 注册失败时回滚：根据 ID 列表删除已写入的家庭、成员、分类。
   * Best-effort：任一 ID 不存在则忽略。
   */
  rollbackRegistration(input: { familyId: string; familyMemberIds: string[]; categoryIds: string[] }): void {
    db.families.delete(input.familyId);
    for (const fmId of input.familyMemberIds) {
      db.familyMembers.delete(fmId);
    }
    for (const cId of input.categoryIds) {
      db.transactionCategories.delete(cId);
    }
  }
}

export const familyRepository = new FamilyRepository();
