# 构建阶段
FROM node:20-alpine3.21 AS builder

# 设置工作目录
WORKDIR /app

# 复制 package.json 和 package-lock.json
COPY package*.json ./

# 安装后端依赖
RUN npm i

# 复制 admin-web 的 package 并安装前端依赖
COPY admin-web/package*.json ./admin-web/
RUN cd admin-web && npm i

# 复制源代码
COPY . .

# 构建后端 + 前端
RUN npm run build && cd admin-web && npm run build

# 运行阶段
FROM node:20-alpine3.21

# 设置工作目录
WORKDIR /app

# 复制 package.json 和 package-lock.json
COPY package*.json ./

# 仅安装生产依赖
RUN npm i --only=production

# 从构建阶段复制构建产物（后端 dist + 前端 admin-web/dist）
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/admin-web/dist ./admin-web/dist

# 设置环境变量
ENV NODE_ENV=production
ENV API_PREFIX=api

# 暴露端口
EXPOSE 3000

# 启动应用
CMD ["node", "dist/main"] 