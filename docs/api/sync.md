# 数据同步接口

## 数据结构

### SyncDataDto 同步数据
```typescript
{
  lastSyncTime: string;      // 最后同步时间（ISO 8601格式）
  changes?: {                // 客户端的变更数据（可选）
    accountBooks?: AccountBook[];           // 账本变更
    accountCategories?: AccountCategory[];   // 分类变更
    accountItems?: AccountItem[];           // 账目变更
    accountShops?: AccountShop[];           // 商家变更
    accountSymbols?: AccountSymbol[];       // 标签变更
    accountFunds?: AccountFund[];           // 资金账户变更
    accountBookFunds?: AccountBookFund[];   // 账本资金账户关联变更
    accountBookUsers?: AccountBookUser[];   // 账本用户关联变更
  }
}
```

## 获取初始数据
```
GET /api/sync/initial

Response: {
  "code": 200,
  "message": "success",
  "data": {
    "data": {
      "accountBooks": AccountBook[],           // 账本列表
      "accountCategories": AccountCategory[],   // 分类列表
      "accountItems": AccountItem[],           // 账目列表
      "accountShops": AccountShop[],           // 商家列表
      "accountSymbols": AccountSymbol[],       // 标签列表
      "accountFunds": AccountFund[],           // 资金账户列表
      "accountBookFunds": AccountBookFund[],   // 账本资金账户关联列表
      "accountBookUsers": AccountBookUser[]    // 账本用户关联列表
    },
    "serverTime": string                       // 服务器时间（ISO 8601格式）
  }
}

Errors:
- 401 未授权
```

## 批量同步数据
```
POST /api/sync/batch

Request Body: SyncDataDto  // 参考 SyncDataDto 数据结构

Response: {
  "code": 200,
  "message": "success",
  "data": {
    "serverChanges": {                         // 服务器端的变更
      "accountBooks": AccountBook[],           // 账本变更
      "accountCategories": AccountCategory[],   // 分类变更
      "accountItems": AccountItem[],           // 账目变更
      "accountShops": AccountShop[],           // 商家变更
      "accountSymbols": AccountSymbol[],       // 标签变更
      "accountFunds": AccountFund[],           // 资金账户变更
      "accountBookFunds": AccountBookFund[],   // 账本资金账户关联变更
      "accountBookUsers": AccountBookUser[]    // 账本用户关联变更
    },
    "conflicts": {                             // 数据冲突（版本冲突的实体）
      "accountBooks": AccountBook[],           // 账本冲突
      "accountCategories": AccountCategory[],   // 分类冲突
      "accountItems": AccountItem[],           // 账目冲突
      "accountShops": AccountShop[],           // 商家冲突
      "accountSymbols": AccountSymbol[],       // 标签冲突
      "accountFunds": AccountFund[],           // 资金账户冲突
      "accountBookFunds": AccountBookFund[],   // 账本资金账户关联冲突
      "accountBookUsers": AccountBookUser[]    // 账本用户关联冲突
    },
    "serverTime": string                       // 服务器时间（ISO 8601格式）
  }
}

Errors:
- 401 未授权
- 400 请求数据格式错误
```

## 同步规则说明

1. 时间戳处理
   - 所有时间戳字段（createdAt、updatedAt）使用毫秒级时间戳存储
   - 客户端和服务器之间的时间同步使用 ISO 8601 格式的字符串
   - 服务器在每次响应中都会返回当前的服务器时间（serverTime）

2. 数据冲突处理
   - 当客户端提交的数据版本（updatedAt）早于服务器端的版本时，视为冲突
   - 冲突的数据会被放入 conflicts 对象中返回
   - 客户端需要根据业务需求决定如何处理冲突（例如：保留服务器版本、合并数据等）

3. 增量同步
   - 客户端通过 lastSyncTime 参数指定上次同步的时间
   - 服务器会返回该时间之后发生变更的所有数据
   - 客户端可以通过 changes 参数提交本地的变更数据

4. 数据完整性
   - 所有实体都包含基础字段（id、createdAt、updatedAt）
   - 业务实体还包含额外的审计字段（createdBy、updatedBy）
   - 关联实体（如 AccountBookFund）必须确保关联的实体存在

5. 权限控制
   - 只能同步当前用户有权限访问的数据
   - 账本相关的数据需要检查用户对账本的权限
   - 资金账户相关的数据需要检查用户的所有权

6. 性能优化
   - 建议客户端定期同步数据，避免单次同步数据量过大
   - 可以根据业务需求调整同步的频率和策略
   - 对于大量数据的同步，建议分批处理
```
