# 分类相关接口

## 创建分类
```
POST /api/account/category

Request Body:
{
  "name": string,           // 分类名称
  "accountBookId": string,  // 所属账本ID
  "code": string           // 分类编码
}

Response: Category         // 参考 Category 数据结构
```

## 查询分类列表
```
GET /api/account/category

Query Parameters:
{
  "accountBookId": string,   // 账本ID
  "name": string?           // 分类名称（可选，用于搜索）
}

Response: Category[]       // 参考 Category 数据结构
```

## 获取分类详情
```
GET /api/account/category/:id

Response: Category        // 参考 Category 数据结构
```

## 更新分类
```
PATCH /api/account/category/:id

Request Body:
{
  "name": string?,        // 分类名称（可选）
  "code": string?        // 分类编码（可选）
}

Response: Category       // 参考 Category 数据结构
```

## 删除分类
```
DELETE /api/account/category/:id

Response: {}            // 返回空对象
```
