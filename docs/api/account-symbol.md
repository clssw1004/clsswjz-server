# 账目属性相关接口

## 数据结构

### SymbolType 属性类型
```typescript
enum SymbolType {
  TAG = 'TAG',      // 标签
  PROJECT = 'PROJECT', // 项目
}
```

### QueryAccountSymbolDto 查询参数
```typescript
{
  accountBookId: string;   // 账本ID
  symbolType: SymbolType;  // 属性类型：TAG-标签，PROJECT-项目
}
```

### CreateAccountSymbolDto 创建参数
```typescript
{
  name: string;           // 名称
  symbolType: SymbolType; // 属性类型：TAG-标签，PROJECT-项目
  accountBookId: string;  // 账本ID
}
```

### UpdateAccountSymbolDto 更新参数
```typescript
{
  name: string;           // 名称
}
```

### AccountSymbol 账目属性实体
```typescript
{
  id: string;              // 主键ID
  name: string;            // 名称
  code: string;            // 编码
  symbolType: SymbolType;  // 类型：TAG-标签，PROJECT-项目
  accountBookId: string;   // 所属账本ID
  createdBy: string;       // 创建人ID
  updatedBy: string;       // 更新人ID
  createdAt: string;       // 创建时间
  updatedAt: string;       // 更新时间
}
```

## 接口列表

### 获取账本下所有类型标识的数据（按类型分组）
```
POST /api/account/symbol/list

Request Body:
{
  "accountBookId": string   // 账本ID
}

Response: {
  "code": 200,
  "message": "success",
  "data": {
    "TAG": AccountSymbol[],      // 标签列表
    "PROJECT": AccountSymbol[],  // 项目列表
  }
}

Errors:
- 400 请求参数错误
```

### 获取账本下指定类型的数据
```
POST /api/account/symbol/listByType

Request Body:
{
  "accountBookId": string,   // 账本ID
  "symbolType": SymbolType   // 属性类型：TAG-标签，PROJECT-项目
}

Response: {
  "code": 200,
  "message": "success",
  "data": AccountSymbol[]    // 属性列表
}

Errors:
- 400 请求参数错误
```

### 更新数据
```
PATCH /api/account/symbol/:id

Path Parameters:
- id: string                // 属性ID

Request Body:
{
  "name": string,           // 名称
}

Response: {
  "code": 200,
  "message": "success",
  "data": AccountSymbol     // 更新后的属性信息
}

Errors:
- 400 请求参数错误
- 404 数据不存在
- 409 该名称已存在
```

### 删除数据
```
PATCH /api/account/symbol/:id

Path Parameters:
- id: string                // 属性ID

Response: {
  "code": 200,
  "message": "success",
  "data": {
    "success": true
  }
}

Errors:
- 400 请求参数错误
- 404 数据不存在
``` 