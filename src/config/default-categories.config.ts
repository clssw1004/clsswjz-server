import { ItemType } from '../pojo/enums/item-type.enum';

export const DEFAULT_CATEGORIES = [
  { name: '餐饮', type: ItemType.EXPENSE },
  { name: '交通', type: ItemType.EXPENSE },
  { name: '购物', type: ItemType.EXPENSE },
  { name: '娱乐', type: ItemType.EXPENSE },
  { name: '日用', type: ItemType.EXPENSE },
  { name: '服饰', type: ItemType.EXPENSE },
  { name: '医疗', type: ItemType.EXPENSE },
  { name: '教育', type: ItemType.EXPENSE },
  { name: '工资', type: ItemType.INCOME },
  { name: '奖金', type: ItemType.INCOME },
  { name: '理财', type: ItemType.INCOME },
  { name: '兼职', type: ItemType.INCOME },
  { name: '报销', type: ItemType.INCOME },
];