# 用户相关接口

## 数据结构

### Language 语言设置
```typescript
enum Language {
  ZH_CN = 'zh-CN',  // 简体中文
  ZH_TW = 'zh-TW',  // 繁体中文
  EN = 'en'         // 英语
}
```

## 注册用户
```
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
```

## 获取当前用户信息
```
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
```

## 更新用户信息
```
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
```

## 通过邀请码查询用户
```
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
```

## 重置邀请码
```
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
```
