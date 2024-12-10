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

## ��查Token有效性
```
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
```
