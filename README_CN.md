# CLSSWJZ - 个人财务管理系统

[English](./README.md)

## 项目概述

CLSSWJZ 是一个完整的个人财务管理系统，包含：

- 后端服务（当前仓库）
- 移动应用：[CLSSWJZ-APP](https://github.com/clssw1004/clsswjz-app)
  - 下载地址：[最新版本](https://github.com/clssw1004/clsswjz-app/releases)

### 功能特点

- 多账本管理
- 资金账户管理
- 收支记录
- 分类管理
- 商家管理
- 用户协作
- 多语言支持（简体中文、繁体中文、英语）
- 多平台支持

## 部署说明

### 方式一：使用预构建镜像

1. 创建 docker-compose.yml：

```yaml
version: '3.8'

services:
  api:
    image: clssw1004/clsswjz-server:0.0.1
    ports:
      - '3000:3000'
    environment:
      - NODE_ENV=production
      - PORT=3000
      - API_PREFIX=api
      - DB_TYPE=sqlite # 或 mysql
      - DATA_PATH=/data # SQLite 数据存储路径
    volumes:
      - ./data:/data # 挂载 SQLite 数据目录
    restart: unless-stopped

  # 可选：MySQL 数据库
  db:
    image: mysql:8
    environment:
      - MYSQL_ROOT_PASSWORD=your_password
      - MYSQL_DATABASE=clsswjz
    volumes:
      - mysql_data:/var/lib/mysql
    ports:
      - '3306:3306'
    restart: unless-stopped

volumes:
  mysql_data:
```

2. 启动服务：

```bash
docker-compose up -d
```

### 方式二：自行构建镜像

1. 克隆仓库：

```bash
git clone https://github.com/clssw1004/clsswjz-server.git
cd clsswjz-server
```

2. 构建镜像：

```bash
docker build -t clsswjz-server .
```

3. 创建 docker-compose.yml（与上面相同，但修改镜像名称为自己构建的）
4. 启动服务：`docker-compose up -d`

## 开发指南

### 开发命令

```bash
# 以监视模式启动开发服务器
npm run start:dev

# 运行测试
npm run test

# 运行端到端测试
npm run test:e2e

# 生成 API 文档
npm run doc:generate

# 运行模拟数据脚本
npm run mock:data
```

### 环境配置

#### 本地开发

在项目根目录创建 `.env` 文件：

```bash
# 服务器配置
PORT=3000                # 服务器端口
API_PREFIX=api          # API前缀
NODE_ENV=development    # 环境：development/production

# 数据库配置（MySQL）
DB_TYPE=mysql          # 数据库类型：mysql/sqlite
DB_HOST=localhost      # 数据库主机
DB_PORT=3306          # 数据库���口
DB_USERNAME=root      # 数据库用户名
DB_PASSWORD=password  # 数据库密码
DB_DATABASE=clsswjz   # 数据库名称

# SQLite 配置
# DB_TYPE=sqlite
# DATA_PATH=/data     # SQLite 数据目录
```

#### Docker 环境变量

使用 Docker 时，可以通过以下方式配置环境变量：

1. docker-compose.yml：

```yaml
services:
  api:
    environment:
      - NODE_ENV=production
      - PORT=3000
      - DB_TYPE=sqlite
      - DATA_PATH=/data
```

2. 环境文件：

```bash
# 创建 .env 文件
cp .env.example .env
docker-compose --env-file .env up -d
```

### API 文档

- [API 文档](docs/api.md)
- [实体文档](docs/entities.md)
- [枚举文档](docs/enums.md)

### 技术栈

- 后端框架：NestJS
- 数据库：MySQL/SQLite
- ORM：TypeORM
- API 文档：Markdown
- 容器化：Docker
- CI/CD：GitHub Actions

### 参与贡献

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

### 更新日志

查看 [CHANGELOG.md](CHANGELOG.md) 了解版本更新历史。

### 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。
