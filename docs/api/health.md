# 健康检查接口

## 获取服务状态
```
GET /api/health

Response:
{
  "status": "ok",        // 服务状态
  "timestamp": string,   // ���前时间戳
  "uptime": number,      // 服务运行时间（秒）
  "memory": {
    "heapUsed": string,  // 已用堆内存
    "heapTotal": string, // 总堆内存
    "rss": string        // 常驻内存
  },
  "database": {
    "status": string     // 数据库连接状态
  }
}
```
