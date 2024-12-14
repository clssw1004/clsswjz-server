# API 文档

## 目录
- [认证相关](api/auth.md)
- [用户相关](api/user.md)
- [账本相关](api/account-book.md)
- [资金账户相关](api/account-fund.md)
- [记账相关](api/account-item.md)
- [分类相关](api/category.md)
- [商家相关](api/shop.md)
- [附件相关](api/attachment.md)
- [健康检查](api/health.md)

## 数据结构
- [实体说明](entities.md)
- [枚举类型](enums.md)

## 通用说明

### 认证方式
所有需要认证的接口都需要在请求头中携带 JWT Token：
```
Authorization: Bearer <token>
```

### 响应格式
所有接口响应格式统一为：
```typescript
{
  code: number;    // HTTP状态码
  message: string; // 响应消息
  data: any;      // 响应数据
}
```
