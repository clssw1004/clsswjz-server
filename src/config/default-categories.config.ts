import { ItemType } from '../pojo/enums/item-type.enum';

export interface DefaultCategory {
  name: string;
  type: ItemType;
}

export const DEFAULT_CATEGORIES: DefaultCategory[] = [
  // 支出类别
  { name: '餐饮', type: "EXPENSE" },
  { name: '交通', type: "EXPENSE" },
  { name: '购物', type: "EXPENSE" },
  { name: '娱乐', type: "EXPENSE" },
  { name: '居住', type: "EXPENSE" },
  { name: '旅行', type: "EXPENSE" },
  { name: '医疗', type: "EXPENSE" },
  { name: '教育', type: "EXPENSE" },
  
  // 收入类别
  { name: '工资', type: "INCOME" },
  { name: '奖金', type: "INCOME" },
  { name: '理财收入', type: "INCOME" },
  { name: '其他收入', type: "INCOME" },
]; 