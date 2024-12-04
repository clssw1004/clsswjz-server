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
