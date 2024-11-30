import { ItemType } from '../pojo/enums/item-type.enum';

export interface DefaultCategory {
  name: string;
  type: ItemType;
}

export const DEFAULT_CATEGORIES: DefaultCategory[] = [
  // 支出类别
  { name: '餐饮', type: ItemType.EXPENSE },
  { name: '交通', type: ItemType.EXPENSE },
  { name: '购物', type: ItemType.EXPENSE },
  { name: '娱乐', type: ItemType.EXPENSE },
  { name: '居住', type: ItemType.EXPENSE },
  { name: '旅行', type: ItemType.EXPENSE },
  { name: '医疗', type: ItemType.EXPENSE },
  { name: '教育', type: ItemType.EXPENSE },
  
  // 收入类别
  { name: '工资', type: ItemType.INCOME },
  { name: '奖金', type: ItemType.INCOME },
  { name: '理财收入', type: ItemType.INCOME },
  { name: '其他收入', type: ItemType.INCOME },
]; 