# 构建阶段
FROM node:20-alpine3.21 AS builder

# 设置工作目录
WORKDIR /app

# 复制 package.json 和 package-lock.json
COPY package*.json ./

# 安装依赖
RUN npm ci

# 复制源代码
COPY . .

# 构建应用
RUN npm run build

# 运行阶段
FROM node:20-alpine3.21

# 设置工作目录
WORKDIR /app

# 复制 package.json 和 package-lock.json
COPY package*.json ./

# 仅安装生产依赖
RUN npm ci --only=production

# 从构建阶段复制构建产物
COPY --from=builder /app/dist ./dist

# 设置环境变量
ENV NODE_ENV=production
ENV PORT=3000
ENV API_PREFIX=api

# 暴露端口
EXPOSE 3000

# 启动应用
CMD ["node", "dist/main"] 