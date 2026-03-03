# 后端Dockerfile
FROM node:18-alpine

WORKDIR /app

# 复制后端依赖文件
COPY backend/package*.json ./
RUN npm ci --only=production

# 复制后端代码
COPY backend/ .

# 创建数据库目录
RUN mkdir -p /app/data

# 暴露端口
EXPOSE 3001

# 启动应用
CMD ["npm", "start"]