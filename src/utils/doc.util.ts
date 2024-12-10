import * as fs from 'fs';
import * as path from 'path';

/**
 * 生成API文档
 */
export const generateApiDocs = () => {
  const docsDir = path.join(process.cwd(), 'docs');
  const apiDir = path.join(docsDir, 'api');

  // 确保目录存在
  if (!fs.existsSync(docsDir)) {
    fs.mkdirSync(docsDir);
  }
  if (!fs.existsSync(apiDir)) {
    fs.mkdirSync(apiDir);
  }

  // 生成各模块文档
  generateAuthDocs();
  generateUserDocs();
  generateAccountBookDocs();
  generateAccountFundDocs();
  generateAccountItemDocs();
  generateCategoryDocs();
  generateShopDocs();
  generateHealthDocs();
  generateEntitiesDocs();
  generateMainDocs();
  generateEnumDocs();
};

/**
 * 生成认证相关接口文档
 */
const generateAuthDocs = () => {
  const docs = `# 认证相关接口

## 登录
\`\`\`
POST /api/auth/login

Request Body:
{
  "username": string,  // 用户名
  "password": string   // 密码
}

Response:
{
  "access_token": string,  // JWT令牌
  "userId": string,       // 用户ID
  "username": string,     // 用户名
  "nickname": string      // 用户昵称
}
\`\`\`

## ��查Token有效性
\`\`\`
GET /api/auth/check

Headers:
{
  "Authorization": "Bearer <token>"  // JWT令牌
}

Response:
{
  "code": 200,
  "message": "success",
  "data": {
    "valid": boolean,        // token是否有效
    "user": {
      "sub": string,        // 用户ID
      "username": string,   // 用户名
      "iat": number,       // token签发时间
      "exp": number        // token过期时间
    }
  }
}

Errors:
- 401 Unauthorized - token无效或已过期
\`\`\`
`;

  fs.writeFileSync(path.join(process.cwd(), 'docs/api/auth.md'), docs);
};

/**
 * 生成用户相关接口文档
 */
const generateUserDocs = () => {
  const docs = `# 用户相关接口

## 数据结构

### Language 语言设置
\`\`\`typescript
enum Language {
  ZH_CN = 'zh-CN',  // 简体中文
  ZH_TW = 'zh-TW',  // 繁体中文
  EN = 'en'         // 英语
}
\`\`\`

## 注册用户
\`\`\`
POST /api/users/register

Request Body:
{
  "username": string,     // 用户名
  "password": string,     // 密码
  "nickname": string?,    // 昵称（可选）
  "email": string?,      // 邮箱（可选）
  "phone": string?,      // 手机号（可选）
  "language": Language?, // 语言设置（可选，默认：zh-CN）
  "timezone": string?    // 时区设置（可选，默认：Asia/Shanghai）
}

Response: {
  "code": 200,
  "message": "success",
  "data": {
    "id": string,          // 用户ID
    "username": string,    // 用户名
    "nickname": string,    // 昵称
    "email": string?,      // 邮箱
    "phone": string?,      // 手机号
    "inviteCode": string,  // 邀请码
    "language": Language,  // 语言设置
    "timezone": string,    // 时区设置
    "createdAt": string,   // 创建时间
    "updatedAt": string    // 更新时间
  }
}

Errors:
- 400 用户名长度必须在2-50个字符之间
- 400 密码长度必须在6-50个字符之间
- 400 邮箱格式不正确
- 400 手机号格式不正确
- 400 语言设置不正确
- 400 时区格式不正确
- 409 用户名已存在
- 409 邮箱已被使用
- 409 手机号已被使用
\`\`\`

## 获取当前用户信息
\`\`\`
GET /api/users/current

Response: {
  "code": 200,
  "message": "success",
  "data": {
    "id": string,          // 用户ID
    "username": string,    // 用户名
    "nickname": string,    // 昵称
    "email": string?,      // 邮箱
    "phone": string?,      // 手机号
    "inviteCode": string,  // 邀请码
    "language": Language,  // 语言设置
    "timezone": string,    // 时区设置
    "createdAt": string,   // 创建时间
    "updatedAt": string    // 更新时间
  }
}

Errors:
- 404 用户不存在
\`\`\`

## 更新用户信息
\`\`\`
PATCH /api/users/current

Request Body:
{
  "nickname": string?,    // 昵称（可选）
  "email": string?,      // 邮箱（可选）
  "phone": string?,      // 手机号（可选）
  "language": Language?, // 语言设置（可选）
  "timezone": string?    // 时区设置（可选）
}

Response: {
  "code": 200,
  "message": "success",
  "data": {
    // 同"获取当前用户信息"的返回数据
  }
}

Errors:
- 400 昵称长度必须在2-50个字符之间
- 400 邮箱格式不正确
- 400 手机号格式不正确
- 400 语言设置不正确
- 400 时区格式不正确
- 404 用户不存在
- 409 该邮箱已被使用
- 409 该手机号已被使用
\`\`\`

## 通过邀请码查询用户
\`\`\`
GET /api/users/invite/:code

Response: {
  "code": 200,
  "message": "success",
  "data": {
    "id": string,          // 用户ID
    "nickname": string     // 用户昵称
  }
}

Errors:
- 404 未找到该邀请码对应的用户
\`\`\`

## 重置邀请码
\`\`\`
PUT /api/users/invite/reset

Response: {
  "code": 200,
  "message": "success",
  "data": {
    "inviteCode": string   // 新的邀请码
  }
}

Errors:
- 404 用户不存在
\`\`\`
`;

  fs.writeFileSync(path.join(process.cwd(), 'docs/api/user.md'), docs);
};

/**
 * 生成健康检查接口文档
 */
const generateHealthDocs = () => {
  const docs = `# 健康检查接口

## 获取服务状态
\`\`\`
GET /api/health

Response:
{
  "status": "ok",        // 服务状态
  "timestamp": string,   // 当前时间戳
  "uptime": number,      // 服务运行时间（秒）
  "memory": {
    "heapUsed": string,  // 已用堆内存
    "heapTotal": string, // 总堆内存
    "rss": string        // 常驻内存
  },
  "database": {
    "status": string     // 数据库连接状态
  }
}
\`\`\`
`;

  fs.writeFileSync(path.join(process.cwd(), 'docs/api/health.md'), docs);
};

/**
 * 生成数据结构文档
 */
const generateEntitiesDocs = () => {
  const docs = `# 数据结构说明

## AccountFund 资金账户
\`\`\`typescript
{
  id: string;              // 主键ID
  name: string;            // 资金账户名称
  fundType: FundType;      // 资金类型
  fundRemark: string;      // 备注
  fundBalance: number;     // 余额
  createdBy: string;       // 创建人ID
  updatedBy: string;       // 更新人ID
  createdAt: Date;         // 创建时间
  updatedAt: Date;         // 更新时间
}
\`\`\`

## AccountBook 账本
\`\`\`typescript
{
  id: string;              // 主键ID
  name: string;            // 账本名称
  description: string;     // 账本描述
  currencySymbol: string; // 货币符号
  icon: string;           // 账本图标
  createdBy: string;      // 创建人ID
  updatedBy: string;      // 更新人ID
  createdAt: Date;        // 创建时间
  updatedAt: Date;        // 更新时间
}
\`\`\`

## Category 分类
\`\`\`typescript
{
  id: string;              // 主键ID
  name: string;            // 分类名称
  accountBookId: string;   // 所属账本ID
  code: string;            // 分类编码
  categoryType: ItemType;  // 分类类型：EXPENSE-支出，INCOME-收入
  lastAccountItemAt: Date; // 最近账目创建时间
  createdBy: string;       // 创建人ID
  updatedBy: string;      // 更新人ID
  createdAt: Date;        // 创建时间
  updatedAt: Date;        // 更新时间
}
\`\`\`

## AccountShop 商家
\`\`\`typescript
{
  id: string;              // 主键ID
  name: string;            // 商家名称
  shopCode: string;        // 商家编码
  accountBookId: string;   // 所属账本ID
  createdBy: string;       // 创建人ID
  updatedBy: string;      // 更新人ID
  createdAt: Date;        // 创建时间
  updatedAt: Date;        // 更新时间
}
\`\`\`

## AccountItem 账目记录
\`\`\`typescript
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
\`\`\`

## User 用户
\`\`\`typescript
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
  createdAt: Date;        // 创建时间
  updatedAt: Date;        // 更新时间
}
\`\`\`

## AccountBookUser 账本用户关联
\`\`\`typescript
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
  createdAt: Date;        // 创建时间
  updatedAt: Date;        // 更新时间
}
\`\`\`

## AccountBookFund 账本资金账户关联
\`\`\`typescript
{
  id: string;              // 主键ID
  accountBookId: string;   // 账本ID
  fundId: string;         // 资金账户ID
  fundIn: boolean;        // 是否可收入
  fundOut: boolean;       // 是否可支出
  isDefault: boolean;     // 是否默认账户
  createdAt: Date;        // 创建时间
  updatedAt: Date;        // 更新时间
}
\`\`\`
`;

  fs.writeFileSync(path.join(process.cwd(), 'docs/entities.md'), docs);
};

/**
 * 生成主文档（包含目录和通用说明）
 */
const generateMainDocs = () => {
  const docs = `# API 文档

## 目录
- [认证相关](api/auth.md)
- [用户相关](api/user.md)
- [账本相关](api/account-book.md)
- [资金账户相关](api/account-fund.md)
- [记账相关](api/account-item.md)
- [分类相关](api/category.md)
- [商家相关](api/shop.md)
- [健康检查](api/health.md)

## 数据结构
- [实体说明](entities.md)
- [枚举类型](enums.md)

## 通用说明

### 认证方式
所有需要认证的接口都需要在请求头中携带 JWT Token：
\`\`\`
Authorization: Bearer <token>
\`\`\`

### 响应格式
所有接口响应格式统一为：
\`\`\`typescript
{
  code: number;    // HTTP状态码
  message: string; // 响应消息
  data: any;      // 响应数据
}
\`\`\`
`;

  fs.writeFileSync(path.join(process.cwd(), 'docs/api.md'), docs);
};

/**
 * 生成资金账户相关接口文档
 */
const generateAccountFundDocs = () => {
  const docs = `# 资金账户相关接口

## 数据结构

### FundType 资金账户类型
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

## 获取用户所有资金账户
\`\`\`
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
\`\`\`

## 创建资金账户
\`\`\`
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
\`\`\`

## 查询账本下的资金账户
\`\`\`
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
\`\`\`

## 获取资金账户详情
\`\`\`
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
\`\`\`

## 更新资金账户
\`\`\`
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
\`\`\`

## 删除资金账户
\`\`\`
DELETE /api/account/fund/:id

Response: {
  "code": 200,
  "message": "success",
  "data": {}
}

Errors:
- 400 该资金账户已关联账本，无法删除
- 404 资金账户不存在
\`\`\`

## 更新资金账户余额
\`\`\`
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
\`\`\`

## 注意事项
1. 每个账本只能有一个默认账户
2. 创建账本的第一个账户会自动设为默认账户
3. 设置新的默认账户时会自动取消原有默认账户的状态
4. 账户可以关联多个账本，每个关联关系都可以独立设置权限和默认状态
5. 账户名称在同一用户下必须唯一
6. 已关联账本的账户不能删除
`;

  fs.writeFileSync(path.join(process.cwd(), 'docs/api/account-fund.md'), docs);
};

/**
 * 生成账本相关接口文档
 */
const generateAccountBookDocs = () => {
  const docs = `# 账本相关接口

## 创建账本
\`\`\`
POST /api/account/book

Request Body:
{
  "name": string,                // 账本名称
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
\`\`\`

## 获取账本列表
\`\`\`
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
    canDeleteBook: boolean, // 删除账本权限
    canViewItem: boolean,   // 查看账目权限
    canEditItem: boolean,   // 编辑目权限
    canDeleteItem: boolean  // 删除账目权限
  }
}>
\`\`\`

// ... 其他账本相关接口
`;

  fs.writeFileSync(path.join(process.cwd(), 'docs/api/account-book.md'), docs);
};

/**
 * 生成记账相关接口文档
 */
const generateAccountItemDocs = () => {
  const docs = `# 记账相关接口

## 数据结构

### AccountItem 记账记录
\`\`\`typescript
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
\`\`\`

### ItemType 记账类型
\`\`\`typescript
enum ItemType {
  EXPENSE = 'EXPENSE',   // 支出
  INCOME = 'INCOME'      // 收入
}
\`\`\`

## 创建记账记录
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
- 403 ���账户在当前账本中不允许支出/收入
\`\`\`

## 查询记账记录
\`\`\`
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
      "shop": string?,          // 商家名称
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
\`\`\`

## 获取记账记录详情
\`\`\`
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
\`\`\`

## 更新记账记录
\`\`\`
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
    "updatedBy": string,      // ��新人ID
    "createdAt": Date,        // 创建时间
    "updatedAt": Date         // 更新时间
  }
}

Errors:
- 404 记账记录不存在
- 403 该账户在当前账本中不允许支出/收入
\`\`\`

## 删除记账记录
\`\`\`
DELETE /api/account/item/:id

Response: {
  "code": 200,
  "message": "success",
  "data": {}
}

Errors:
- 404 记账记录不存在
\`\`\`

## 批量创建记账记录
\`\`\`
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
\`\`\`
`;

  fs.writeFileSync(path.join(process.cwd(), 'docs/api/account-item.md'), docs);
};

/**
 * 生成分类相关接口文档
 */
const generateCategoryDocs = () => {
  const docs = `# 分类相关接口

## 创建分类
\`\`\`
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
\`\`\`

## 更新分类
\`\`\`
PATCH /api/account/category/:id

Request Body:
{
  "name": string?,        // 分类名称（可选）
  "code": string?        // 分类编码（可选）
}

Response: 同"创建分类"的返回数据

Errors:
- 404 分类不存在
- 400 分类类型不允许修改
\`\`\`

// ... 其他接口文档
`;

  fs.writeFileSync(path.join(process.cwd(), 'docs/api/category.md'), docs);
};

/**
 * 生成商家相关接口文档
 */
const generateShopDocs = () => {
  const docs = `# 商家相关接口

## 创建商家
\`\`\`
POST /api/account/shop

Request Body:
{
  "name": string,           // 商家名称
  "accountBookId": string   // 所属账本ID
}

Response: {
  "id": string,            // 主键ID
  "name": string,          //商家名称
  "shopCode": string,      // 商家编码
  "accountBookId": string, // 所属账本ID
  "createdBy": string,     // 创建人ID
  "updatedBy": string,     // 更新人ID
  "createdAt": string,     // 创建时间
  "updatedAt": string      // 更新时间
}
\`\`\`

## 获取账本下的商家列表
\`\`\`
GET /api/account/shop?accountBookId=:accountBookId

Response: AccountShop[]   // 参考 AccountShop 数据结构
\`\`\`

## 获取商家详情
\`\`\`
GET /api/account/shop/:id

Response: AccountShop    // 参考 AccountShop 数据结构
\`\`\`

## 更新商家
\`\`\`
PATCH /api/account/shop/:id

Request Body:
{
  "name": string        // 商家名称
}

Response: AccountShop   // 参考 AccountShop 数据结构
\`\`\`

## 删除商家
\`\`\`
DELETE /api/account/shop/:id

Response: {}           // 返回空对象
\`\`\`
`;

  fs.writeFileSync(path.join(process.cwd(), 'docs/api/shop.md'), docs);
};

/**
 * 生成枚举类型说明文档
 */
const generateEnumDocs = () => {
  const docs = `# 枚举类型说明

## ItemType 记账类型
\`\`\`typescript
enum ItemType {
  EXPENSE = 'EXPENSE',   // 支出
  INCOME = 'INCOME'      // 收入
}
\`\`\`

## FundType 资金账户类型
\`\`\`typescript
enum FundType {
  CASH = 'CASH',            // 现金
  DEBIT_CARD = 'DEBIT',     // 储蓄卡
  CREDIT_CARD = 'CREDIT',   // 信用卡
  PREPAID_CARD = 'PREPAID', // 充值卡
  DEBT = 'DEBT',            // 欠款
  E_WALLET = 'E_WALLET',    // 网络钱包
  ALIPAY = 'ALIPAY',        // 支付宝
  WECHAT = 'WECHAT',        // 微信
  INVESTMENT = 'INVESTMENT',// 投资账户
  OTHER = 'OTHER'           // 其他
}
\`\`\`

## Language 语言设置
\`\`\`typescript
enum Language {
  ZH_CN = 'zh-CN',  // 简体中文
  ZH_TW = 'zh-TW',  // 繁体中文
  EN = 'en'         // 英语
}
\`\`\`

## Currency 货币类型
\`\`\`typescript
enum Currency {
  CNY = 'CNY',  // 人民币
  USD = 'USD',  // 美元
  EUR = 'EUR',  // 欧元
  GBP = 'GBP',  // 英镑
  JPY = 'JPY',  // 日元
  HKD = 'HKD'   // 港币
}
\`\`\`
`;

  fs.writeFileSync(path.join(process.cwd(), 'docs/enums.md'), docs);
};