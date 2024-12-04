# 用户相关接口

## 注册用户
```
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
  "id": string,          // 用户ID
  "username": string,    // 用户名
  "nickname": string,    // 昵称
  "email": string?,      // 邮箱
  "phone": string?,      // 手机号
  "inviteCode": string,  // 邀请码
  "createdAt": string,   // 创建时间
  "updatedAt": string    // 更新时间
}
```

## 获取当前用户信息
```
GET /api/users/current

Response:
{
  "id": string,          // 用户ID
  "username": string,    // 用户名
  "nickname": string,    // 昵称
  "email": string?,      // 邮箱
  "phone": string?,      // 手机号
  "inviteCode": string,  // 邀请码
  "createdAt": string,   // 创建时间
  "updatedAt": string    // 更新时间
}
```

## 更新用户信息
```
PATCH /api/users/current

Request Body:
{
  "nickname": string?,    // 昵称（可选）
  "email": string?,      // 邮箱（可选）
  "phone": string?       // 手机号（可选）
}

Response: 同"获取当前用户信息"
```

## 通过邀请码查询用户
```
GET /api/users/invite/:code

Response:
{
  "id": string,          // 用户ID
  "nickname": string     // 用户昵称
}
```

## 重置邀请码
```
PUT /api/users/invite/reset

Response:
{
  "inviteCode": string   // 新的邀请码
}
```
