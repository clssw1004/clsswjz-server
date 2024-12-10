# CLSSWJZ - 个人财务管理系统

[English](./README.md)

## 项目组成
- 后端服务 (当前仓库)
- 移动应用: [CLSSWJZ-APP](https://github.com/clssw1004/clsswjz-app.git) (Flutter)

### 简介

CLSSWJZ 是一个完整的个人财务管理系统，包含后端服务和移动应用。它通过多账本、资金账户和协作记账等功能，帮助用户管理个人财务。

### 功能特点

- 多账本管理
- 资金账户管理
- 收支记录
- 分类管理
- 商家管理
- 用户协作
- 多语言支持（简体中文、繁体中文、英语）
- 多平台支持

### 技术栈

- 后端：NestJS + TypeORM
- 数据库：MySQL/SQLite
- API文档：Markdown
- 移动端：Flutter

### 部署说明

CLSSWJZ 支持传统的自托管部署和使用 Docker 的容器化部署两种方式。您可以根据需求选择合适的部署方式：

#### 自托管部署
自托管部署让您完全控制运行环境，适合以下场景：
- 需要自定义数据库配置
- 需要与现有基础设施集成
- 有特殊的安全要求
- 需要最大化性能

环境要求：
- Node.js 运行环境
- MySQL 或 SQLite 数据库
- 反向代理（推荐使用 Nginx）
- 进程管理器（推荐使用 PM2）

主要步骤：
1. 配置数据库
2. 设置环境变量
3. 构建并启动应用
4. 设置反向代理
5. 配置进程管理器

#### Docker 部署
Docker 部署提供隔离的、一致的环境，适合以下场景：
- 快速简单的部署
- 需要跨平台一致性
- 易于扩展和更新
- 最小化系统依赖

部署选项：
1. 单容器部署：适合个人使用或小规模部署
2. Docker Compose 部署：推荐用于生产环境，包含：
   - API 服务容器
   - 数据库容器
   - 数据卷持久化
   - 网络隔离
3. Kubernetes 部署：可用于大规模部署

主要优势：
- 简化依赖管理
- 简单的数据库配置
- 自动容器重启
- 内置日志和监控
- 便捷的备份和迁移

[详细部署指南](#deployment-guides)

### 开发说明

#### 环境要求

- Node.js >= 18
- MySQL/SQLite
- npm/yarn

#### 安装步骤

```bash
# 克隆仓库
git clone https://github.com/your-repo/clsswjz-server.git

# 安装依赖
npm install

# 配置环境变量
cp .env.example .env
# 编辑 .env 文件，设置数据库配置

# 启动开发服务器
npm run start:dev
```

#### 开发命令
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

#### Docker 开发环境

```bash
# 构建镜像
npm run docker:build

# 使用 docker-compose 运行
npm run docker:compose
```

### 文档

- [API 文档](docs/api.md)
- [实体文档](docs/entities.md)

### 环境配置

#### 本地开发
在项目根目录创建 `.env` 文件，配置以下环境变量：

```bash
# 服务器配置
PORT=3000                # 服务器端口
API_PREFIX=api          # API前缀
NODE_ENV=development    # 环境：development/production

# 数据库配置（MySQL）
DB_TYPE=mysql          # 数据库类型：mysql/sqlite
DB_HOST=localhost      # 数据库主机
DB_PORT=3306          # 数据库端口
DB_USERNAME=root      # 数据库用户名
DB_PASSWORD=password  # 数据库密码
DB_DATABASE=clsswjz   # 数据库名称

# 数据库配置（SQLite）
# DB_TYPE=sqlite
# DB_DATABASE=db.sqlite
```

#### Docker 环境配置
使用 Docker 时，可以通过以下方式配置环境变量：

1. 使用 docker-compose.yml：
```yaml
services:
  api:
    environment:
      - PORT=3000
      - API_PREFIX=api
      - NODE_ENV=production
      - DB_TYPE=mysql
      - DB_HOST=db
      - DB_PORT=3306
      - DB_USERNAME=root
      - DB_PASSWORD=your_password
      - DB_DATABASE=clsswjz
```

2. 使用环境文件：
```bash
# 创建 .env 文件
cp .env.example .env

# 使用 docker-compose 启动
docker-compose --env-file .env up -d
```

3. 使用命令行：
```bash
docker run -d \
  -e PORT=3000 \
  -e DB_TYPE=mysql \
  -e DB_HOST=db \
  -e DB_PORT=3306 \
  -e DB_USERNAME=root \
  -e DB_PASSWORD=your_password \
  -e DB_DATABASE=clsswjz \
  clsswjz-server
```

#### 数据库选择
1. MySQL 配置：
```env
DB_TYPE=mysql
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=your_password
DB_DATABASE=clsswjz
```

2. SQLite 配置：
```env
DB_TYPE=sqlite
DB_DATABASE=db.sqlite
```