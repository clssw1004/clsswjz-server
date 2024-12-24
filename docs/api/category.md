# 分类相关接口

## 创建分类
```
POST /api/account/category

Request Body:
{
  "name": string,           // 分类名称
  "accountBookId": string,  // 所属账本ID
  "categoryType": ItemType  // 分类类型：EXPENSE-支出，INCOME-收入
}

Response: {
  "code": 200,
  "message": "success",
  "data": {
    "id": string,              // 主键ID
    "name": string,            // 分类名称
    "accountBookId": string,   // 所属账本ID
    "code": string,            // 分类编码
    "categoryType": ItemType,  // 分类类型
    "lastAccountItemAt": Date, // 最近账目创建时间
    "createdBy": string,       // 创建人ID
    "updatedBy": string,       // 更新人ID
    "createdAt": Date,         // 创建时间
    "updatedAt": Date          // 更新时间
  }
}

Errors:
- 409 分类名称在当前账本中已存在
```

## 更新分类
```
PATCH /api/account/category/:id

Request Body:
{
  "name": string?,        // 分类名称（可选）
  "code": string?        // 分类编码（可选）
}

Response: 同"创建分类"的返回数据

Errors:
- 404 分类不存在
- 400 分类类型不允许改
```

// ... 其他接口文档
