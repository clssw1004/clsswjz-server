import { ItemType } from '../../enums/item-type.enum';
import { AttachmentEntity } from '../../entities/attachment.entity';

/**
 * 账目详情VO
 */
export class AccountItemVO {
  id: string; // 主键ID
  amount: number; // 金额
  description: string; // 描述
  type: ItemType; // 类型：EXPENSE-支出，INCOME-收入
  categoryCode: string; // 分类编码
  category: string; // 分类名称
  accountDate: string; // 记账日期
  accountBookId: string; // 账本ID
  fundId: string; // 账户ID
  fund: string; // 账户名称
  shopCode?: string; // 商家编码
  shop?: string; // 商家名称
  createdBy: string; // 创建人ID
  updatedBy: string; // 更新人ID
  createdAt: string; // 创建时间
  updatedAt: string; // 更新时间
  attachments: AttachmentEntity[]; // 附件列表
}

/**
 * 账目分页查询结果VO
 */
export class AccountItemPageVO {
  items: AccountItemVO[]; // 账目列表
  summary: {
    allIn: number; // 总收入
    allOut: number; // 总支出
    allBalance: number; // 结余（总收入-总支出）
  };
  pagination: {
    isLastPage: boolean; // 是否最后一页
    total: number; // 总记录数
    totalPage: number; // 总页数
    current: number; // 当前页码
    pageSize: number; // 每页大小
  };
}
