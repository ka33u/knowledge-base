FROM node:18-alpine

WORKDIR /app

# 复制 package 文件
COPY package*.json ./

# 安装依赖
RUN npm install --only=production

# 复制源代码
COPY src/ ./src/

# 创建上传目录
RUN mkdir -p /app/uploads

# 暴露端口
EXPOSE 5000

# 启动应用
CMD ["node", "src/app.js"]
