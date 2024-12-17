# 商家相关接口

## 创建商家
```
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
```

## 获取账本下的商家列表
```
GET /api/account/shop?accountBookId=:accountBookId

Response: AccountShop[]   // 参考 AccountShop 数据结构
```

## 获取商家详情
```
GET /api/account/shop/:id

Response: AccountShop    // 参考 AccountShop 数据结构
```

## 更新商家
```
PATCH /api/account/shop/:id

Request Body:
{
  "name": string        // 商家名称
}

Response: AccountShop   // 参考 AccountShop 数据结构
```

## 删除商家
```
DELETE /api/account/shop/:id

Response: {}           // 返回空对象
```
