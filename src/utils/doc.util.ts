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
  generateAttachmentDocs();
  generateSyncDocs();
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

## 检查Token有效性
\`\`\`
GET /api/auth/validate

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
      "exp": number,       // token过期时间
      "nickname": string,  // 用户昵称
      "email": string,    // 邮箱
      "phone": string,    // 手机号
      "inviteCode": string, // 邀请码
      "language": string,   // 语言设置
      "timezone": string,   // 时区设置
      "stats": {
        "totalItems": number,    // 总记账笔数
        "totalDays": number,     // 总记账天数
        "totalIncome": number,   // 总收入
        "totalExpense": number,  // 总支出
        "netAssets": number      // 净资产（总收入-总支出）
      }
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
    "createdAt": number,   // 创建时间（时间戳）
    "updatedAt": number    // 更新时间（时间戳）
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
    "createdAt": number,   // 创建时间（时间戳）
    "updatedAt": number    // 更新时间（时间戳）
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
  createdAt: number;       // 创建时间（时间戳）
  updatedAt: number;       // 更新时间（时间戳）
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
  createdAt: number;      // 创建时间（时间戳）
  updatedAt: number;      // 更新时间（时间戳）
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
  createdAt: number;      // 创建时间（时间戳）
  updatedAt: number;      // 更新时间（时间戳）
}
\`\`\`

## AccountShop 商家
\`\`\`typescript
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
  createdAt: number;      // 创建时间（时间戳）
  updatedAt: number;      // 更新时间（时间戳）
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
  createdAt: number;      // 创建时间（时间戳）
  updatedAt: number;      // 更新时间（时间戳）
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
  createdAt: number;      // 创建时间（时间戳）
  updatedAt: number;      // 更新时间（时间戳）
}
\`\`\`

## AttachmentEntity 附件
\`\`\`typescript
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
- [附件相关](api/attachment.md)
- [数据同步](api/sync.md)
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
3. 设置新的默认账户时自动取消原有默认账户的状态
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
  "accountDate": number     // 记账日期（时间戳）
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
    "accountDate": number,     // 记账日期（时间戳）
    "accountBookId": string,  // 账本ID
    "fundId": string,         // 账户ID
    "code": string?,      // 商家编码
    "shop": string?,          // 商家名称
    "createdBy": string,      // 创建人ID
    "updatedBy": string,      // 更新人ID
    "createdAt": number,      // 创建时间（时间戳）
    "updatedAt": number,      // 更新时间（时间戳）
    "attachments": Array<{    // 附件列表
      "id": string,           // 附件ID
      "originName": string,   // 原始文件名
      "fileLength": number,   // 文件大小
      "extension": string,    // 文件扩展名
      "contentType": string,  // 文件类型
      "businessCode": string, // 业务类型
      "businessId": string,   // 业务ID
      "createdAt": number,    // 创建时间（时间戳）
      "updatedAt": number     // 更新时间（时间戳）
    }>
  }
}

Errors:
- 404 账本不存在
- 403 该账户在当前账本中不允许支出/收入
\`\`\`

## 查询记账记录
\`\`\`
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
  "startDate": number?,      // 开始日期（可选，时间戳）
  "endDate": number?,        // 结束日期（可选，时间戳）
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
      "accountDate": number,     // 记账日期（时间戳）
      "accountBookId": string,  // 账本ID
      "fundId": string,         // 账户ID
      "fundName": string,       // 账户名称
      "code": string?,      // 商家编码
      "shop": string?,          // 商家名称
      "createdBy": string,      // 创建人ID
      "updatedBy": string,      // 更新人ID
      "createdAt": number,      // 创建时间（时间戳）
      "updatedAt": number,      // 更新时间（时间戳）
      "attachments": Array<{    // 附件列表
        "id": string,           // 附件ID
        "originName": string,   // 原始文件名
        "fileLength": number,   // 文件大小
        "extension": string,    // 文件扩展名
        "contentType": string,  // 文件类型
        "businessCode": string, // 业务类型
        "businessId": string,   // 业务ID
        "createdAt": number,    // 创建时间（时间戳）
        "updatedAt": number     // 更新时间（时间戳）
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
\`\`\`

## 更新记账记录
\`\`\`
PATCH /api/account/item/:id
Content-Type: multipart/form-data

Request Body:
{
  "amount": number?,         // 金额（可选）
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
\`\`\`

## 删除记账记录
\`\`\`
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

## 批量删除记账记录
\`\`\`
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
- 400 分类类型不允许改
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
  "code": string,      // 商家编码
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

/**
 * 生成附件相关接口文档
 */
const generateAttachmentDocs = () => {
  const docs = `# 附件相关接口

## 数据结构

### BusinessCode 业务类型
\`\`\`typescript
enum BusinessCode {
  ITEM = 'item',   // 账目
  BOOK = 'book',   // 账本
  FUND = 'fund',   // 资金账户
  USER = 'user',   // 用户
}
\`\`\`

### AttachmentEntity 附件实体
\`\`\`typescript
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
\`\`\`

## 下载附件
\`\`\`
GET /api/attachments/:id

Response Headers:
{
  "Content-Type": string,      // 文件MIME类型
  "Content-Disposition": string,// 文件下载名称
  "Content-Length": number     // 文件大小
}

Response Body: 文件二进制内容

Errors:
- 404 附件不存在
- 404 附件文件不存在
- 404 文件下载失败
\`\`\`

## 上传附件
上传传通过其他业务接口进行，例如创建账目时可以同时上传附件：

\`\`\`
POST /api/account/item
Content-Type: multipart/form-data

Request Body:
{
  // 账目相关字段...
  files: File[]  // 附件文件列表
}

Response: 参考账目创建接口
\`\`\`

上传的附件文件将被保存在 DATA_PATH/attachments 目录下，文件名为附件ID。
`;

  fs.writeFileSync(path.join(process.cwd(), 'docs/api/attachment.md'), docs);
};

/**
 * 生成数据同步相关接口文档
 */
const generateSyncDocs = () => {
  const docs = `# 数据同步接口

## 数据结构

### SyncDataDto 同步数据
\`\`\`typescript
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
\`\`\`

## 获取初始数据
\`\`\`
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
    "lasySyncTime": string                       // 服务器时间（ISO 8601格式）
  }
}

Errors:
- 401 未授权
\`\`\`

## 批量同步数据
\`\`\`
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
    "lasySyncTime": string                       // 服务器时间（ISO 8601格式）
  }
}

Errors:
- 401 未授权
- 400 请求数据格式错误
\`\`\`

## 同步规则说明

1. 时间戳处理
   - 所有时间戳字段（createdAt、updatedAt）使用毫秒级时间戳存储
   - 客户端和服务器之间的时间同步使用 ISO 8601 格式的字符串
   - 服务器在每次响应中都会返回当前的服务器时间（lasySyncTime）

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
\`\`\`
`;

  fs.writeFileSync(path.join(process.cwd(), 'docs/api/sync.md'), docs);
};
