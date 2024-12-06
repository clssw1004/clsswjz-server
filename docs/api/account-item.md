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
  shopCode: string;       // 商家编码
  createdBy: string;      // 创建人ID
  updatedBy: string;      // 更新人ID
  createdAt: Date;        // 创建时间
  updatedAt: Date;        // 更新时间
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

Request Body:
{
  "accountBookId": string,   // 账本ID
  "fundId": string,         // 资金账户ID
  "amount": number,         // 金额
  "type": ItemType,         // 类型：EXPENSE-支出，INCOME-收入
  "category": string,       // 分类
  "shop": string?,         // 商家（可选）
  "description": string?,   // 描述（可选）
  "accountDate": Date      // 记账日期
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
    "shopCode": string?,      // 商家编码
    "shop": string?,          // 商家名称
    "createdBy": string,      // 创建人ID
    "updatedBy": string,      // 更新人ID
    "createdAt": Date,        // 创建时间
    "updatedAt": Date         // 更新时间
  }
}

Errors:
- 404 账本不存在
- 403 该账户在当前账本中不允许支出/收入
```

## 查询记账记录
```
GET /api/account/item/list

Query Parameters:
{
  "accountBookId": string?,    // 账本ID（可选）
  "category": string?,         // 分类（可选）
  "categories": string[]?,     // 分类列表（可选）
  "fundId": string?,          // 资金账户ID（可选）
  "fundIds": string[]?,       // 资金账户ID列表（可选）
  "shopCode": string?,        // 商家编码（可选）
  "shopCodes": string[]?,     // 商家编码列表（可选）
  "startDate": string?,       // 开始日期（可选）
  "endDate": string?,         // 结束日期（可选）
  "type": ItemType?,          // 类型（可选）
  "minAmount": number?,       // 最小金额（可选）
  "maxAmount": number?        // 最大金额（可选）
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
      "shopCode": string?,      // 商家编码
      "shop": string?,          // 商家名��
      "createdBy": string,      // 创建人ID
      "updatedBy": string,      // 更新人ID
      "createdAt": Date,        // 创建时间
      "updatedAt": Date         // 更新时间
    }>,
    "summary": {
      "allIn": number,        // 总收入
      "allOut": number,       // 总支出
      "allBalance": number    // 结余（总收入-总支出）
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
    "shopCode": string?,      // 商家编码
    "shop": string?,          // 商家名称
    "createdBy": string,      // 创建人ID
    "updatedBy": string,      // 更新人ID
    "createdAt": Date,        // 创建时间
    "updatedAt": Date         // 更新时间
  }
}

Errors:
- 404 记账记录不存在
```

## 更新���账记录
```
PATCH /api/account/item/:id

Request Body:
{
  "amount": number?,         // 金额（可选）
  "type": ItemType?,        // 类型（可选）
  "category": string?,      // 分类（可选）
  "shop": string?,         // 商家（可选）
  "description": string?,   // 描述（可选）
  "accountDate": Date?,    // 记账日期（可选）
  "fundId": string?        // 资金账户ID（可选）
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
    "shopCode": string?,      // 商家编码
    "shop": string?,          // 商家名称
    "createdBy": string,      // 创建人ID
    "updatedBy": string,      // 更新人ID
    "createdAt": Date,        // 创建时间
    "updatedAt": Date         // 更新时间
  }
}

Errors:
- 404 记账记录不存在
- 403 该账户在当前账本中不允许支出/收���
```

## 删除记账记录
```
DELETE /api/account/item/:id

Response: {
  "code": 200,
  "message": "success",
  "data": {}
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
  "description": string?,   // 描述（可选）
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
