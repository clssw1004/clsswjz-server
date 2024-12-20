# 记账相关接口

## 数据结构

### AccountItem 记账记录
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
  createdAt: Date;        // 创建时间
  updatedAt: Date;        // 更新时间
  attachments: Array<{    // 附件列表
    id: string;           // 附件ID
    originName: string;   // 原始文件名
    fileLength: number;   // 文件大小
    extension: string;    // 文件扩展名
    contentType: string;  // 文件类型
    businessCode: string; // 业务类型
    businessId: string;   // 业务ID
    createdAt: string;    // 创建时间
    updatedAt: string;    // 更新时间
  }>
}
```

### ItemType 记账类型
```typescript
enum ItemType {
  EXPENSE = 'EXPENSE',   // 支出
  INCOME = 'INCOME'      // 收入
}
```

## 创建记账记录
```
POST /api/account/item
Content-Type: multipart/form-data

Request Body:
{
  "accountBookId": string,   // 账本ID
  "fundId": string,         // 资金账户ID
  "amount": number,         // 金额
  "type": ItemType,         // 类型：EXPENSE-支出，INCOME-收入
  "category": string,       // 分类
  "shop": string?,         // 商家（可选）
  "description": string?,   // 描述（可选）
  "accountDate": Date,     // 记账日期
  "attachments": File[]          // 附件文件列表（可选）
}

Response: {
  "code": 200,
  "message": "success",
  "data": {
    "id": string,              // 主键ID
    "amount": number,          // 金额
    "description": string,     // 描述
    "type": ItemType,         // 类型：EXPENSE-支出，INCOME-收入
    "categoryCode": string,    // 分类编码
    "category": string,        // 分类名称
    "accountDate": Date,      // 记账日期
    "accountBookId": string,  // 账本ID
    "fundId": string,         // 账户ID
    "code": string?,      // 商家编码
    "shop": string?,          // 商家名称
    "createdBy": string,      // 创建人ID
    "updatedBy": string,      // 更新人ID
    "createdAt": Date,        // 创建时间
    "updatedAt": Date,        // 更新时间
    "attachments": Array<{    // 附件列表
      "id": string,           // 附件ID
      "originName": string,   // 原始文件名
      "fileLength": number,   // 文件大小
      "extension": string,    // 文件扩展名
      "contentType": string,  // 文件类型
      "businessCode": string, // 业务类型
      "businessId": string,   // 业务ID
      "createdAt": string,    // 创建时间
      "updatedAt": string     // 更新时间
    }>
  }
}

Errors:
- 404 账本不存在
- 403 该账户在当前账本中不允许支出/收入
```

## 查询记账记录
```
POST /api/account/item/list

Request Body:
{
  "accountBookId": string,    // 账本ID
  "category": string?,        // 分类（可选）
  "categories": string[]?,    // 分类列表（可选）
  "fundId": string?,         // 资金账户ID（可选）
  "fundIds": string[]?,      // 资金账户ID列表（可选）
  "code": string?,       // 商家编码（可选）
  "codes": string[]?,    // 商家编码列表（可选）
  "startDate": string?,      // 开始日期（可选）
  "endDate": string?,        // 结束日期（可选）
  "type": ItemType?,         // 类型（可选）
  "minAmount": number?,      // 最小金额（可选）
  "maxAmount": number?,      // 最大金额（可选）
  "page": number?,           // 页码（可选，默认1）
  "pageSize": number?        // 每页大小（可选，默认50）
}

Response: {
  "code": 200,
  "message": "success",
  "data": {
    "items": Array<{
      "id": string,              // 主键ID
      "amount": number,          // 金额
      "description": string,     // 描述
      "type": ItemType,         // 类型：EXPENSE-支出，INCOME-收入
      "categoryCode": string,    // 分类编码
      "category": string,        // 分类名称
      "accountDate": Date,      // 记账日期
      "accountBookId": string,  // 账本ID
      "fundId": string,         // 账户ID
      "fundName": string,       // 账户名称
      "code": string?,      // 商家编码
      "shop": string?,          // 商家名称
      "createdBy": string,      // 创建人ID
      "updatedBy": string,      // 更新人ID
      "createdAt": Date,        // 创建时间
      "updatedAt": Date,        // 更新时间
      "attachments": Array<{    // 附件列表
        "id": string,           // 附件ID
        "originName": string,   // 原始文件名
        "fileLength": number,   // 文件大小
        "extension": string,    // 文件扩展名
        "contentType": string,  // 文件类型
        "businessCode": string, // 业务类型
        "businessId": string,   // 业务ID
        "createdAt": string,    // 创建时间
        "updatedAt": string     // 更新时间
      }>
    }>,
    "summary": {
      "allIn": number,        // 总收入
      "allOut": number,       // 总支出
      "allBalance": number    // 结余（总收入-总支出）
    },
    "pagination": {
      "isLastPage": boolean,  // 是否最后一页
      "total": number,        // 总记录数
      "totalPage": number,    // 总页数
      "current": number,      // 当前页码
      "pageSize": number      // 每页大小
    }
  }
}
```

## 获取记账记录详情
```
GET /api/account/item/:id

Response: {
  "code": 200,
  "message": "success",
  "data": {
    "id": string,              // 主键ID
    "amount": number,          // 金额
    "description": string,     // 描述
    "type": ItemType,         // 类型：EXPENSE-支出，INCOME-收入
    "categoryCode": string,    // 分类编码
    "category": string,        // 分类名称
    "accountDate": Date,      // 记账日期
    "accountBookId": string,  // 账本ID
    "fundId": string,         // 账户ID
    "code": string?,      // 商家编码
    "shop": string?,          // 商家名称
    "createdBy": string,      // 创建人ID
    "updatedBy": string,      // 更新人ID
    "createdAt": Date,        // 创建时间
    "updatedAt": Date,        // 更新时间
    "attachments": Array<{    // 附件列表
      "id": string,           // 附件ID
      "originName": string,   // 原始文件名
      "fileLength": number,   // 文件大小
      "extension": string,    // 文件扩展名
      "contentType": string,  // 文件类型
      "businessCode": string, // 业务类型
      "businessId": string,   // 业务ID
      "createdAt": string,    // 创建时间
      "updatedAt": string     // 更新时间
    }>
  }
}

Errors:
- 404 记账记录不存在
```

## 更新记账记录
```
PATCH /api/account/item/:id
Content-Type: multipart/form-data

Request Body:
{
  "amount": number?,         // 金额（可��）
  "type": ItemType?,        // 类型（可选）
  "category": string?,      // 分类（可选）
  "shop": string?,         // 商家（可选）
  "description": string?,   // 描述（可选）
  "accountDate": Date?,    // 记账日期（可选）
  "fundId": string?,       // 资金账户ID（可选）
  "deleteAttachmentIds": string[]?, // 要删除的附件ID列表（可选）
  "attachments": File[]    // 新上传的附件文件列表（可选）
}

Response: {
  "code": 200,
  "message": "success",
  "data": {
    "id": string,              // 主键ID
    "amount": number,          // 金额
    "description": string,     // 描述
    "type": ItemType,         // 类型：EXPENSE-支出，INCOME-收入
    "categoryCode": string,    // 分类编码
    "category": string,        // 分类名称
    "accountDate": Date,      // 记账日期
    "accountBookId": string,  // 账本ID
    "fundId": string,         // 账户ID
    "code": string?,      // 商家编码
    "shop": string?,          // 商家名称
    "createdBy": string,      // 创建人ID
    "updatedBy": string,      // 更新人ID
    "createdAt": Date,        // 创建时间
    "updatedAt": Date,        // 更新时间
    "attachments": Array<{    // 附件列表
      "id": string,           // 附件ID
      "originName": string,   // 原始文件名
      "fileLength": number,   // 文件大小
      "extension": string,    // 文件扩展名
      "contentType": string,  // 文件类型
      "businessCode": string, // 业务类型
      "businessId": string,   // 业务ID
      "createdAt": string,    // 创建时间
      "updatedAt": string     // 更新时间
    }>
  }
}

Errors:
- 404 记账记录不存在
- 403 该账户在当前账本中不允许支出/收入
```

## 删除记账记录
```
DELETE /api/account/item/:id

Response: {
  "code": 200,
  "message": "success",
  "data": {
    "success": true
  }
}

Errors:
- 404 记账记录不存在
```

## 批量创建记账记录
```
POST /api/account/item/batch

Request Body: Array<{
  "accountBookId": string,   // 账本ID
  "fundId": string,         // 资金账户ID
  "amount": number,         // 金额
  "type": ItemType,         // 类型：EXPENSE-支出，INCOME-收入
  "category": string,       // 分类
  "shop": string?,         // 商家（可选）
  "description": string?,   // 描述���可选）
  "accountDate": Date      // 记账日期
}>

Response: {
  "code": 200,
  "message": "success", 
  "data": {
    "successCount": number,   // 成功创建的记录数
    "errors": string[]?      // 错误信息列表（如果有）
  }
}

Errors:
- 404 账本不存在
- 403 该账户在当前账本中不允许支出/收入
```

## 批量删除记账记录
```
POST /api/account/item/batch/delete

Request Body: string[]  // 账目ID数组

Response: {
  "code": 200,
  "message": "success",
  "data": {
    "successCount": number,   // 成功删除的记录数
    "errors": string[]?      // 错误信息列表（如果有）
  }
}

Errors:
- 404 账目不存在
- 403 没有删除权限
```
