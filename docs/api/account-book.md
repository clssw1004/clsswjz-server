# 账本相关接口

## 创建账本
```
POST /api/account/book

Request Body:
{
  "name": string,                // 账本���称
  "description": string?,        // 账本描述（可选）
  "currencySymbol": Currency,    // 货币符号
  "icon": string?               // 账本图标（选）
}

Response: {
  "id": string,              // 主键ID
  "name": string,            // 账本名称
  "description": string,     // 账本描述
  "currencySymbol": Currency,// 货币符号
  "icon": string,           // 账本图标
  "createdAt": Date,        // 创建时间
  "updatedAt": Date,        // 更新时间
  "createdBy": string,      // 创建人ID
  "updatedBy": string       // 更新人ID
}
```

## 获取账本列表
```
GET /api/account/book

Response: Array<{
  id: string,              // 主键ID
  name: string,            // 账本名称
  description: string,     // 账本描述
  currencySymbol: Currency,// 货币符号
  icon: string,           // 账本图标
  createdAt: Date,        // 创建时间
  updatedAt: Date,        // 更新时间
  createdBy: string,      // 创建人ID
  updatedBy: string,      // 更新人ID
  fromId: string,         // 创建人ID
  fromName: string,       // 创建人昵称
  permissions: {          // 当前用户权限
    canViewBook: boolean,   // 查看账本权限
    canEditBook: boolean,   // 编辑账本权限
    canDeleteBook: boolean, // 删除���本权限
    canViewItem: boolean,   // 查看账目权限
    canEditItem: boolean,   // 编辑目权限
    canDeleteItem: boolean  // 删除账目权限
  }
}>
```

// ... 其他账本相关接口
