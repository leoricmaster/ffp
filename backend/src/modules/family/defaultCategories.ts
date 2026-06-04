// 14 条默认分类（6 INCOME + 8 EXPENSE）
// v4 §6.2：注册时事务内插入

import type { TransactionCategoryType } from '../../shared/types';

export interface DefaultCategorySeed {
  name: string;
  type: TransactionCategoryType;
  sortOrder: number;
}

export const DEFAULT_INCOME_CATEGORIES: DefaultCategorySeed[] = [
  { name: '工资收入', type: 'INCOME', sortOrder: 1 },
  { name: '奖金', type: 'INCOME', sortOrder: 2 },
  { name: '投资收益', type: 'INCOME', sortOrder: 3 },
  { name: '兼职收入', type: 'INCOME', sortOrder: 4 },
  { name: '礼金', type: 'INCOME', sortOrder: 5 },
  { name: '其他收入', type: 'INCOME', sortOrder: 6 },
];

export const DEFAULT_EXPENSE_CATEGORIES: DefaultCategorySeed[] = [
  { name: '餐饮', type: 'EXPENSE', sortOrder: 1 },
  { name: '交通', type: 'EXPENSE', sortOrder: 2 },
  { name: '居家', type: 'EXPENSE', sortOrder: 3 },
  { name: '医疗', type: 'EXPENSE', sortOrder: 4 },
  { name: '教育', type: 'EXPENSE', sortOrder: 5 },
  { name: '娱乐', type: 'EXPENSE', sortOrder: 6 },
  { name: '购物', type: 'EXPENSE', sortOrder: 7 },
  { name: '其他支出', type: 'EXPENSE', sortOrder: 8 },
];

/** 全部 14 条默认分类 */
export const ALL_DEFAULT_CATEGORIES: DefaultCategorySeed[] = [
  ...DEFAULT_INCOME_CATEGORIES,
  ...DEFAULT_EXPENSE_CATEGORIES,
];
