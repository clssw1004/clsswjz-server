# 数据结构说明

## AccountFund 资金账户
```typescript
{
  id: string;              // 主键ID
  name: string;            // 资金账户名称
  fundType: FundType;      // 资金类型
  fundRemark: string;      // 备注
  fundBalance: number;     // 余额
  createdBy: string;       // 创建人ID
  updatedBy: string;       // 更新人ID
  createdAt: number;       // 创建时间（时间戳）
  updatedAt: number;       // 更新时间（时间戳）
}
```

## AccountBook 账本
```typescript
{
  id: string;              // 主键ID
  name: string;            // 账本名称
  description: string;     // 账本描述
  currencySymbol: string; // 货币符号
  icon: string;           // 账本图标
  createdBy: string;      // 创建人ID
  updatedBy: string;      // 更新人ID
  createdAt: number;      // 创建时间（时间戳）
  updatedAt: number;      // 更新时间（时间戳）
}
```

## Category 分类
```typescript
{
  id: string;              // 主键ID
  name: string;            // 分类名称
  accountBookId: string;   // 所属账本ID
  code: string;            // 分类编码
  categoryType: ItemType;  // 分类类型：EXPENSE-支出，INCOME-收入
  lastAccountItemAt: Date; // 最近账目创建时间
  createdBy: string;       // 创建人ID
  updatedBy: string;      // 更新人ID
  createdAt: number;      // 创建时间（时间戳）
  updatedAt: number;      // 更新时间（时间戳）
}
```

## AccountShop 商家
```typescript
{
  id: string;              // 主键ID
  name: string;            // 商家名称
  code: string;        // 商家编码
  accountBookId: string;   // 所属账本ID
  createdBy: string;       // 创建人ID
  updatedBy: string;      // 更新人ID
  createdAt: number;      // 创建时间（时间戳）
  updatedAt: number;      // 更新时间（时间戳）
}
```

## AccountItem 账目记录
```typescript
{
  id: string;              // 主键ID
  amount: number;          // 金额
  description: string;     // 描述
  type: ItemType;         // 类型：EXPENSE-支出，INCOME-收入
  categoryCode: string;    // 分类编码
  accountDate: Date;      // 记账日期
  accountBookId: string;  // 账本ID
  fundId: string;         // 账户ID
  code: string;       // 商家编码
  createdBy: string;      // 创建人ID
  updatedBy: string;      // 更新人ID
  createdAt: number;      // 创建时间（时间戳）
  updatedAt: number;      // 更新时间（时间戳）
  attachments: Array<{    // 附件列表
    id: string;           // 附件ID
    originName: string;   // 原始文件名
    fileLength: number;   // 文件大小
    extension: string;    // 文件扩展名
    contentType: string;  // 文件类型
    businessCode: string; // 业务类型
    businessId: string;   // 业务ID
    createdAt: string;    // 创建时间
    updatedAt: string     // 更新时间
  }>
}
```

## User 用户
```typescript
{
  id: string;              // 主键ID
  username: string;        // 用户名
  nickname: string;        // 昵称
  password: string;        // 密码（加密存储）
  email: string;          // 邮箱
  phone: string;          // 手机号
  inviteCode: string;     // 邀请码
  language: Language;     // 语言设置
  timezone: string;       // 时区设置
  createdAt: number;      // 创建时间（时间戳）
  updatedAt: number;      // 更新时间（时间戳）
}
```

## AccountBookUser 账本用户关联
```typescript
{
  id: string;              // 主键ID
  userId: string;          // 用户ID
  accountBookId: string;   // 账本ID
  canViewBook: boolean;    // 查看账本权限
  canEditBook: boolean;    // 编辑账本权限
  canDeleteBook: boolean;  // 删除账本权限
  canViewItem: boolean;    // 查看账目权限
  canEditItem: boolean;    // 编辑账目权限
  canDeleteItem: boolean;  // 删除账目权限
  createdAt: number;      // 创建时间（时间戳）
  updatedAt: number;      // 更新时间（时间戳）
}
```

## AccountBookFund 账本资金账户关联
```typescript
{
  id: string;              // 主键ID
  accountBookId: string;   // 账本ID
  fundId: string;         // 资金账户ID
  fundIn: boolean;        // 是否可收入
  fundOut: boolean;       // 是否可支出
  isDefault: boolean;     // 是否默认账户
  createdAt: number;      // 创建时间（时间戳）
  updatedAt: number;      // 更新时间（时间戳）
}
```

## AttachmentEntity 附件
```typescript
{
  id: string;              // 主键ID
  originName: string;      // 原始文件名
  fileLength: number;      // 文件大小(字节)
  extension: string;       // 文件扩展名
  contentType: string;     // 文件MIME类型
  businessCode: BusinessCode; // 业务类型
  businessId: string;      // 业务ID
  createdBy: string;       // 创建人ID
  updatedBy: string;       // 更新人ID
  createdAt: number;       // 创建时间（时间戳）
  updatedAt: number;       // 更新时间（时间戳）
}
```
