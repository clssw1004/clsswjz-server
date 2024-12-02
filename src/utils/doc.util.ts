import * as fs from 'fs';
import * as path from 'path';

/**
 * 生成API文档并写入文件
 */
export const generateApiDocs = () => {
  const docs = `# API 文档

## 目录
- [认证相关](#认证相关)
- [用户相关](#用户相关)
- [账本相关](#账本相关)
- [资金账户相关](#资金账户相关)
- [记账相关](#记账相关)
- [分类相关](#分类相关)
- [商家相关](#商家相关)

## 认证相关

### 登录
\`\`\`
POST /api/auth/login

Request Body:
{
  "username": string,  // 用户名
  "password": string   // 密码
}

Response:
{
  "access_token": string  // JWT令牌
}
\`\`\`

## 用户相关

### 注册用户
\`\`\`
POST /api/users/register

Request Body:
{
  "username": string,     // 用户名
  "password": string,     // 密码
  "nickname": string?,    // 昵称（可选）
  "email": string?,      // 邮箱（可选）
  "phone": string?       // 手机号（可选）
}

Response:
{
  "id": string,
  "username": string,
  "nickname": string,
  "email": string?,
  "phone": string?,
  "inviteCode": string,
  "createdAt": string,
  "updatedAt": string
}
\`\`\`

### 通过邀请码查询用户
\`\`\`
GET /api/users/invite/:code

Response:
{
  "id": string,
  "nickname": string
}
\`\`\`

### 重置邀请码
\`\`\`
PUT /api/users/invite/reset

Response:
{
  "inviteCode": string
}
\`\`\`

### 获取当前用户信息
\`\`\`
GET /api/users/current

Response:
{
  "id": string,
  "username": string,
  "nickname": string,
  "email": string?,
  "phone": string?,
  "inviteCode": string,
  "createdAt": string,
  "updatedAt": string
}
\`\`\`

### 更新当前用户信息
\`\`\`
PUT /api/users/current

Request Body:
{
  "nickname": string?,    // 昵称（可选）
  "email": string?,      // 邮箱（可选）
  "phone": string?       // 手机号（可选）
}

Response:
{
  "id": string,
  "username": string,
  "nickname": string,
  "email": string?,
  "phone": string?,
  "inviteCode": string,
  "createdAt": string,
  "updatedAt": string
}
\`\`\`

## 账本相关

### 创建账本
\`\`\`
POST /api/account/book

Request Body:
{
  "name": string,                // 账本名称
  "description": string?,        // 账本描述（可选）
  "currencySymbol": Currency,    // 货币符号
  "icon": string?               // 账本图标（可选）
}

Response: AccountBook
\`\`\`

### 获取账本列表
\`\`\`
GET /api/account/book

Response: AccountBook[]
\`\`\`

### 获取账本详情
\`\`\`
GET /api/account/book/:id

Response: AccountBook
\`\`\`

### 更新账本
\`\`\`
PATCH /api/account/book/:id

Request Body:
{
  "id": string,
  "name": string,
  "description": string?,
  "currencySymbol": Currency,
  "icon": string?,
  "members": [
    {
      "userId": string,
      "canViewBook": boolean,
      "canEditBook": boolean,
      "canDeleteBook": boolean,
      "canViewItem": boolean,
      "canEditItem": boolean,
      "canDeleteItem": boolean
    }
  ]
}

Response: AccountBook
\`\`\`

### 删除账本
\`\`\`
DELETE /api/account/book/:id

Response: void
\`\`\`

## 资金账户相关

### 创建资金账户
\`\`\`
POST /api/account/fund

Request Body:
{
  "accountBookId": string,      // 账本ID
  "fundName": string,           // 账户名称
  "fundType": FundType,         // 账户类型
  "fundRemark": string?,        // 备注（可选）
  "fundBalance": number,        // 余额
  "isDefault": boolean         // 是否默认账户
}

Response: AccountFund
\`\`\`

### 查询账本下的资金账户
\`\`\`
POST /api/account/fund/listByAccountBookId

Request Body:
{
  "accountBookId": string,   // 账本ID
  "fundName": string?       // 账户名称（可选，用于搜索）
}

Response: AccountFund[]
\`\`\`

### 获取资金账户详情
\`\`\`
GET /api/account/fund/:id

Response: AccountFund
\`\`\`

### 更新资金账户
\`\`\`
PATCH /api/account/fund/:id

Request Body: Partial<AccountFund>

Response: AccountFund
\`\`\`

### 删除资金账户
\`\`\`
DELETE /api/account/fund/:id

Response: void
\`\`\`

### 更新资金账户余额
\`\`\`
PATCH /api/account/fund/:id/balance

Request Body:
{
  "amount": number    // 新的余额
}

Response: AccountFund
\`\`\`

## 记账相关

### 创建记账记录
\`\`\`
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

Response: AccountItem
\`\`\`

### 查询记账记录
\`\`\`
POST /api/account/item/list

Request Body:
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

Response: AccountItem[]
\`\`\`

### 获取记账记录详情
\`\`\`
GET /api/account/item/:id

Response: AccountItem
\`\`\`

### 更新记账记录
\`\`\`
PATCH /api/account/item/:id

Request Body: UpdateAccountItemDto

Response: AccountItem
\`\`\`

### 删除记账记录
\`\`\`
DELETE /api/account/item/:id

Response: void
\`\`\`

## 分类相关

### 创建分类
\`\`\`
POST /api/account/category

Request Body:
{
  "name": string,           // 分类名称
  "accountBookId": string,  // 所属账本ID
  "code": string           // 分类编码
}

Response: Category
\`\`\`

### 查询分类列表
\`\`\`
GET /api/account/category

Query Parameters:
{
  "accountBookId": string,   // 账本ID
  "name": string?           // 分类名称（可选，用于搜索）
}

Response: Category[]
\`\`\`

### 获取分类详情
\`\`\`
GET /api/account/category/:id

Response: Category
\`\`\`

### 更新分类
\`\`\`
PATCH /api/account/category/:id

Request Body: Partial<Category>

Response: Category
\`\`\`

### 删除分类
\`\`\`
DELETE /api/account/category/:id

Response: void
\`\`\`

## 商家相关

### 获取账本下的商家列表
\`\`\`
GET /api/account/shop?accountBookId=:accountBookId

Response: AccountShop[]
\`\`\`

### 获取商家详情
\`\`\`
GET /api/account/shop/:id

Response: AccountShop
\`\`\`

### 删除商家
\`\`\`
DELETE /api/account/shop/:id

Response: void
\`\`\`

## 数据结构

### Currency 枚举
\`\`\`typescript
enum Currency {
  CNY = 'CNY',    // 人民币
  USD = 'USD',    // 美元
  EUR = 'EUR',    // 欧元
  GBP = 'GBP',    // 英镑
  JPY = 'JPY'     // 日元
}
\`\`\`

### ItemType 枚举
\`\`\`typescript
enum ItemType {
  EXPENSE = 'EXPENSE',   // 支出
  INCOME = 'INCOME'      // 收入
}
\`\`\`

### FundType 枚举
\`\`\`typescript
enum FundType {
  CASH = 'CASH',            // 现金
  DEBIT_CARD = 'DEBIT',     // 储蓄卡
  CREDIT_CARD = 'CREDIT',   // 信用卡
  PREPAID_CARD = 'PREPAID', // 充值卡
  DEBT = 'DEBT',            // 欠款
  E_WALLET = 'E_WALLET'     // 网络钱包
}
\`\`\`

注意：所有需要认证的接口都需要在请求头中携带 JWT Token：
\`\`\`
Authorization: Bearer <token>
\`\`\`
`;

  const docsPath = path.join(process.cwd(), 'docs', 'api.md');
  fs.writeFileSync(docsPath, docs, 'utf8');
};