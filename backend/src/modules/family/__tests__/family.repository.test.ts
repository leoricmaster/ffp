// family.repository 单元测试

import { clearDatabase, db } from '../../../shared/database';
import { familyRepository } from '../repositories/family.repository';
import { ALL_DEFAULT_CATEGORIES, DEFAULT_INCOME_CATEGORIES, DEFAULT_EXPENSE_CATEGORIES } from '../defaultCategories';

describe('FamilyRepository', () => {
  beforeEach(() => {
    clearDatabase();
  });

  describe('createFamily', () => {
    test('默认字段与 v4 §6.1 一致', () => {
      const f = familyRepository.createFamily();
      expect(f.name).toBe('我的家庭');
      expect(f.currency).toBe('CNY');
      expect(f.timezone).toBe('Asia/Shanghai');
      expect(f.language).toBe('zh-CN');
      expect(f.status).toBe('active');
    });
  });

  describe('createFamilyMember', () => {
    test('默认 role=ADMIN', () => {
      const m = familyRepository.createFamilyMember('usr-1', 'fam-1');
      expect(m.role).toBe('ADMIN');
      expect(m.status).toBe('active');
    });
  });

  describe('createDefaultCategories', () => {
    test('插入 14 条（6 INCOME + 8 EXPENSE）', () => {
      const cats = familyRepository.createDefaultCategories('fam-1');
      expect(cats).toHaveLength(14);
      const incomes = cats.filter((c) => c.type === 'INCOME');
      const expenses = cats.filter((c) => c.type === 'EXPENSE');
      expect(incomes).toHaveLength(6);
      expect(expenses).toHaveLength(8);
    });

    test('INCOME 分类顺序正确', () => {
      const cats = familyRepository.createDefaultCategories('fam-1');
      const incomes = cats.filter((c) => c.type === 'INCOME').sort((a, b) => a.sortOrder - b.sortOrder);
      expect(incomes[0].name).toBe('工资收入');
      expect(incomes[1].name).toBe('奖金');
    });

    test('EXPENSE 分类顺序正确', () => {
      const cats = familyRepository.createDefaultCategories('fam-1');
      const expenses = cats.filter((c) => c.type === 'EXPENSE').sort((a, b) => a.sortOrder - b.sortOrder);
      expect(expenses[0].name).toBe('餐饮');
      expect(expenses[7].name).toBe('其他支出');
    });

    test('所有分类 system_default=true', () => {
      const cats = familyRepository.createDefaultCategories('fam-1');
      for (const c of cats) {
        expect(c.systemDefault).toBe(true);
      }
    });

    test('all categories module-level constant', () => {
      expect(ALL_DEFAULT_CATEGORIES).toHaveLength(14);
      expect(DEFAULT_INCOME_CATEGORIES).toHaveLength(6);
      expect(DEFAULT_EXPENSE_CATEGORIES).toHaveLength(8);
    });
  });

  describe('rollbackRegistration', () => {
    test('回滚删除 family / members / categories', () => {
      const family = familyRepository.createFamily();
      const member = familyRepository.createFamilyMember('usr-1', family.id);
      const cats = familyRepository.createDefaultCategories(family.id);

      // 先验证数据存在
      expect(db.families.get(family.id)).toBeDefined();
      expect(db.familyMembers.get(member.id)).toBeDefined();
      for (const c of cats) {
        expect(db.transactionCategories.get(c.id)).toBeDefined();
      }

      // 回滚
      familyRepository.rollbackRegistration({
        familyId: family.id,
        familyMemberIds: [member.id],
        categoryIds: cats.map((c) => c.id),
      });

      expect(db.families.get(family.id)).toBeUndefined();
      expect(db.familyMembers.get(member.id)).toBeUndefined();
      for (const c of cats) {
        expect(db.transactionCategories.get(c.id)).toBeUndefined();
      }
    });
  });
});
