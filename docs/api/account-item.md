# 记账相关接口

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
  ...AccountItem,          // 继承 AccountItem 所有字段
  category: string,        // 分类名称
  shop: string?,          // 商家名称
  shopCode: string?       // 商家编码
}
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

Response: Array<{
  ...AccountItem,          // 继承 AccountItem 所有字段
  category: string,        // 分类名称
  shop: string?,          // 商家名称
  shopCode: string?       // 商家编码
}>
```

## 获取记账记录详情
```
GET /api/account/item/:id

Response: {
  ...AccountItem,          // 继承 AccountItem 所有字段
  category: string,        // 分类名称
  shop: string?,          // 商家名称
  shopCode: string?       // 商家编码
}
```

## 更新记账记录
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

Response: 同"获取记账记录详情"
```

## 删除记账记录
```
DELETE /api/account/item/:id

Response: {}               // 返回空对象
```
