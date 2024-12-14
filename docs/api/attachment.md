# 附件相关接口

## 数据结构

### BusinessCode 业务类型
```typescript
enum BusinessCode {
  ITEM = 'item',   // 账目
  BOOK = 'book',   // 账本
  FUND = 'fund',   // 资金账户
  USER = 'user',   // 用户
}
```

### AttachmentEntity 附件实体
```typescript
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
  createdAt: Date;         // 创建时间
  updatedAt: Date;         // 更新时间
}
```

## 下载附件
```
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
```

## 上传附件
附件上传通过其他业务接口进行，例如创建账目时可以同时上传附件：

```
POST /api/account/item
Content-Type: multipart/form-data

Request Body:
{
  // 账目相关字段...
  files: File[]  // 附件文件列表
}

Response: 参考账目创建接口
```

上传的附件文件将被保存在 DATA_PATH/attachments 目录下，文件名为附件ID。
