# 认证相关接口

## 登录
```
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
```

## 检查Token有效性
```
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
```
