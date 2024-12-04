# 资金账户相关接口

## 数据结构

### FundType 资金账户类型
```typescript
enum FundType {
  CASH = 'CASH',            // 现金
  DEBIT_CARD = 'DEBIT',     // 储蓄卡
  CREDIT_CARD = 'CREDIT',   // 信用卡
  PREPAID_CARD = 'PREPAID', // 充值卡
  DEBT = 'DEBT',            // 欠款
  E_WALLET = 'E_WALLET'     // 网络钱包
}
```

## 获取用户所有资金账户
```
GET /api/account/fund/list

Response: {
  "code": 200,
  "message": "success",
  "data": Array<{
    id: string,              // 主键ID
    name: string,            // 账户名称
    fundType: FundType,      // 账户类型
    fundRemark: string,      // 备注
    fundBalance: number,     // 余额
    createdBy: string,       // 创建人ID
    creatorName: string,     // 创建人名称
    updatedBy: string,       // 更新人ID
    createdAt: string,       // 创建时间
    updatedAt: string,       // 更新时间
    fundBooks: Array<{       // 关联的账本信息（包含用户有权限的所有账本）
      accountBookId: string, // 账本ID
      accountBookName: string,// 账本名称
      accountBookIcon: string,// 账本图标
      fundIn: boolean,       // 是否可收入（未关联账本时为false）
      fundOut: boolean,      // 是否可支出（未关联账本时为false）
      isDefault: boolean     // 是否为账本默认账户（未关联账本时为false）
    }>                       // 按isDefault降序排序，默认账户排在最前面
  }>
}
```

## 创建资金账户
```
POST /api/account/fund

Request Body:
{
  "name": string,           // 账户名称（同一用户下唯一）
  "fundType": FundType,     // 账户类型，参考 FundType 枚举
  "fundRemark": string?,    // 备注（可选）
  "fundBalance": number     // 余额
}

Response: {
  "code": 200,
  "message": "success",
  "data": {
    "id": string,              // 主键ID
    "name": string,            // 账户名称
    "fundType": FundType,      // 账户类型
    "fundRemark": string,      // 备注
    "fundBalance": number,     // 余额
    "createdBy": string,       // 创建人ID
    "updatedBy": string,       // 更新人ID
    "createdAt": string,       // 创建时间
    "updatedAt": string        // 更新时间
  }
}

Errors:
- 400 账户名称已存在
```

## 查询账本下的资金账户
```
POST /api/account/fund/bookfunds

Request Body:
{
  "accountBookId": string,   // 账本ID
  "name": string?           // 账户名称（可选，用于搜索）
}

Response: {
  "code": 200,
  "message": "success",
  "data": Array<{
    id: string,              // 主键ID
    name: string,            // 账户名称
    fundType: FundType,      // 账户类型
    fundRemark: string,      // 备注
    fundBalance: number,     // 余额
    createdBy: string,       // 创建人ID
    updatedBy: string,       // 更新人ID
    createdAt: string,       // 创建时间
    updatedAt: string,       // 更新时间
    fundIn: boolean,         // 是否可收入
    fundOut: boolean,        // 是否可支出
    isDefault: boolean,      // 是否为账本默认账户
    accountBookName: string  // 账本名称
  }>
}
```

## 获取资金账户详情
```
GET /api/account/fund/:id

Response: {
  "code": 200,
  "message": "success",
  "data": {
    id: string,              // 主键ID
    name: string,            // 账户名称
    fundType: FundType,      // 账户类型
    fundRemark: string,      // 备注
    fundBalance: number,     // 余额
    createdBy: string,       // 创建人ID
    updatedBy: string,       // 更新人ID
    createdAt: string,       // 创建时间
    updatedAt: string,       // 更新时间
    fundBooks: Array<{       // 关联的账本信息
      accountBookId: string, // 账本ID
      accountBookName: string,// 账本名称
      accountBookIcon: string,// 账本图标
      fundIn: boolean,       // 是否可收入
      fundOut: boolean,      // 是否可支出
      isDefault: boolean     // 是否为账本默认账户
    }>
  }
}
```

## 更新资金账户
```
PATCH /api/account/fund/:id

Request Body:
{
  "name": string?,          // 账户名称（可选）
  "fundType": FundType?,    // 账户类型（可选）
  "fundRemark": string?,    // 备注（可选）
  "fundBalance": number?,   // 余额（可选）
  "fundBooks": [           // 账本关联（可选）
    {
      "accountBookId": string,  // 账本ID
      "fundIn": boolean,        // 是否可记录收入
      "fundOut": boolean,       // 是否可记录支出
      "isDefault": boolean      // 是否为账本默认账户
    }
  ]
}

Response: {
  "code": 200,
  "message": "success",
  "data": {
    ...AccountFund,           // 继承 AccountFund 所有字段
    fundBooks: Array<{       // 关联的账本信息
      accountBookId: string, // 账本ID
      accountBookName: string,// 账本名称
      accountBookIcon: string,// 账本图标
      fundIn: boolean,       // 是否可收入
      fundOut: boolean,      // 是否可支出
      isDefault: boolean     // 是否为账本默认账户
    }>
  }
}

Errors:
- 400 账户名称已存在
- 404 资金账户不存在
```

## 删除资金账户
```
DELETE /api/account/fund/:id

Response: {
  "code": 200,
  "message": "success",
  "data": {}
}

Errors:
- 400 该资金账户已关联账本，无法删除
- 404 资金账户不存在
```

## 更新资金账户余额
```
PATCH /api/account/fund/:id/balance

Request Body:
{
  "amount": number         // 新的余额
}

Response: {
  "code": 200,
  "message": "success",
  "data": AccountFund      // 参考 AccountFund 数据结构
}

Errors:
- 404 资金账户不存在
```

## 注意事项
1. 每个账本只能有一个默认账户
2. 创建账本的第一个账户会自动设为默认账户
3. 设置新的默认账户时会自动取消原有默认账户的状态
4. 账户可以关联多个账本，每个关联关系都可以独立设置权限和默认状态
5. 账户名称在同一用户下必须唯一
6. 已关联账本的账户不能删除
