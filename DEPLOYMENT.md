# 知识库管理系统 - 部署指南

本指南将帮助您在不同的环境中部署知识库管理系统。

## 目录

1. [部署方式](#部署方式)
2. [Docker 部署](#docker-部署)
3. [本地开发部署](#本地开发部署)
4. [生产环境部署](#生产环境部署)
5. [云存储配置](#云存储配置)
6. [Nginx 反向代理](#nginx-反向代理)
7. [环境变量配置](#环境变量配置)
8. [数据库备份](#数据库备份)
9. [故障排查](#故障排查)

---

## 部署方式

本系统支持以下部署方式：

1. **Docker Compose** (推荐) - 最简单的方式，一键部署
2. **本地开发** - 适合开发和测试
3. **生产环境** - 适合正式部署

---

## Docker 部署

### 前置要求

- Docker 20.10+
- Docker Compose 1.29+

### 快速开始

1. **克隆项目**

```bash
git clone <repository-url>
cd knowledge-base
```

2. **配置环境变量**

编辑 `docker-compose.yml` 文件，修改必要的环境变量：

```yaml
environment:
  MONGODB_URI: mongodb://admin:mongodbpassword@mongodb:27017/knowledge-base?authSource=admin
  JWT_SECRET: your-jwt-secret-key-change-in-production  # 修改为强密钥
```

3. **启动服务**

```bash
docker-compose up -d
```

4. **查看服务状态**

```bash
docker-compose ps
```

5. **查看日志**

```bash
# 查看所有服务日志
docker-compose logs -f

# 查看特定服务日志
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f mongodb
```

6. **初始化管理员账户**

```bash
# 进入后端容器
docker-compose exec backend sh

# 运行种子脚本
npm run seed

# 退出容器
exit
```

7. **访问系统**

- 前端: http://localhost:3000
- 后端API: http://localhost:5000
- API文档: http://localhost:5000/api-docs
- MongoDB: localhost:27017

### 默认账户

系统初始化后，您可以使用以下默认账户登录：

| 邮箱 | 密码 | 角色 |
|------|------|------|
| admin@knowledge-base.com | Admin@123 | 管理员 |
| editor@knowledge-base.com | Editor@123 | 编辑 |
| user@knowledge-base.com | User@123 | 普通用户 |

**重要**: 首次登录后请立即修改默认密码！

### 常用命令

```bash
# 停止服务
docker-compose stop

# 启动服务
docker-compose start

# 重启服务
docker-compose restart

# 停止并删除容器
docker-compose down

# 停止并删除容器和数据卷
docker-compose down -v

# 重新构建镜像
docker-compose build

# 更新并重启
docker-compose up -d --build
```

---

## 本地开发部署

### 前置要求

- Node.js 18+
- MongoDB 6+
- npm 或 yarn

### 1. 安装 MongoDB

**macOS (Homebrew)**:
```bash
brew install mongodb-community
brew services start mongodb-community
```

**Ubuntu/Debian**:
```bash
sudo apt-get install mongodb
sudo systemctl start mongodb
```

**Windows**:
下载并安装 MongoDB Community Server: https://www.mongodb.com/try/download/community

### 2. 配置后端

```bash
cd backend
npm install

# 创建 .env 文件
cat > .env << EOF
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/knowledge-base
JWT_SECRET=your-jwt-secret-key
JWT_EXPIRES_IN=7d
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=52428800
EOF

# 创建上传目录
mkdir -p uploads

# 启动后端服务
npm run dev
```

### 3. 初始化数据库

```bash
# 在另一个终端运行
npm run seed
```

### 4. 配置前端

```bash
cd frontend
npm install

# 启动前端服务
npm run dev
```

### 5. 访问系统

- 前端: http://localhost:5173 (Vite默认端口)
- 后端API: http://localhost:5000
- API文档: http://localhost:5000/api-docs

---

## 生产环境部署

### 1. 使用 PM2 部署后端

```bash
# 安装 PM2
npm install -g pm2

# 进入后端目录
cd backend

# 配置生产环境变量
cat > .env.production << EOF
PORT=5000
NODE_ENV=production
MONGODB_URI=mongodb://your-mongodb-host:27017/knowledge-base
JWT_SECRET=your-strong-jwt-secret
JWT_EXPIRES_IN=7d
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=52428800
EOF

# 安装依赖
npm install --only=production

# 使用 PM2 启动
pm2 start src/app.js --name knowledge-base-backend --env production

# 查看状态
pm2 status

# 查看日志
pm2 logs knowledge-base-backend

# 设置开机自启
pm2 startup
pm2 save
```

### 2. 构建前端

```bash
cd frontend

# 构建生产版本
npm run build

# 构建产物在 dist 目录
```

### 3. 使用 Nginx 托管前端

创建 Nginx 配置文件 `/etc/nginx/sites-available/knowledge-base`:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # 前端静态文件
    root /path/to/knowledge-base/frontend/dist;
    index index.html;

    # 前端路由
    location / {
        try_files $uri $uri/ /index.html;
    }

    # 后端 API 代理
    location /api {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # 上传文件访问
    location /uploads {
        proxy_pass http://localhost:5000;
    }

    # Gzip 压缩
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
}
```

启用配置：

```bash
# 创建软链接
sudo ln -s /etc/nginx/sites-available/knowledge-base /etc/nginx/sites-enabled/

# 测试配置
sudo nginx -t

# 重启 Nginx
sudo systemctl restart nginx
```

### 4. 配置 HTTPS (使用 Let's Encrypt)

```bash
# 安装 Certbot
sudo apt-get install certbot python3-certbot-nginx

# 获取证书
sudo certbot --nginx -d your-domain.com

# 自动续期
sudo certbot renew --dry-run
```

---

## 云存储配置

### 阿里云 OSS 配置

1. 安装依赖

```bash
cd backend
npm install ali-oss
```

2. 创建 OSS 配置文件 `src/config/oss.js`:

```javascript
const OSS = require('ali-oss');

const client = new OSS({
  region: 'oss-cn-hangzhou',
  accessKeyId: process.env.OSS_ACCESS_KEY_ID,
  accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET,
  bucket: 'your-bucket-name'
});

module.exports = client;
```

3. 修改上传中间件使用 OSS

参考阿里云 OSS SDK 文档实现文件上传功能。

### 腾讯云 COS 配置

类似地，可以配置腾讯云 COS 或其他云存储服务。

---

## 环境变量配置

### 后端环境变量

| 变量名 | 说明 | 默认值 | 必填 |
|--------|------|--------|------|
| `PORT` | 服务端口 | 5000 | 否 |
| `NODE_ENV` | 运行环境 | development | 否 |
| `MONGODB_URI` | MongoDB连接字符串 | - | 是 |
| `JWT_SECRET` | JWT密钥 | - | 是 |
| `JWT_EXPIRES_IN` | Token过期时间 | 7d | 否 |
| `UPLOAD_DIR` | 上传目录 | ./uploads | 否 |
| `MAX_FILE_SIZE` | 最大文件大小 | 52428800 (50MB) | 否 |

### 前端环境变量

创建 `.env.production` 文件：

```bash
VITE_API_BASE_URL=https://your-domain.com/api
```

---

## 数据库备份

### 自动备份脚本

创建备份脚本 `backup.sh`:

```bash
#!/bin/bash

# 配置
BACKUP_DIR="/backup/knowledge-base"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
MONGODB_URI="mongodb://localhost:27017/knowledge-base"

# 创建备份目录
mkdir -p $BACKUP_DIR

# 备份数据库
echo "Starting backup..."
mongodump --uri="$MONGODB_URI" --out="$BACKUP_DIR/$TIMESTAMP"

# 压缩备份
echo "Compressing backup..."
tar -czf "$BACKUP_DIR/backup_$TIMESTAMP.tar.gz" -C "$BACKUP_DIR" "$TIMESTAMP"

# 删除7天前的备份
echo "Cleaning old backups..."
find $BACKUP_DIR -name "backup_*.tar.gz" -mtime +7 -delete
find $BACKUP_DIR -type d -mtime +7 -exec rm -rf {} +

echo "Backup completed: $BACKUP_DIR/backup_$TIMESTAMP.tar.gz"
```

设置定时任务（每天凌晨2点备份）：

```bash
crontab -e

# 添加以下行
0 2 * * * /path/to/backup.sh >> /var/log/backup.log 2>&1
```

### 恢复数据库

```bash
# 解压备份
tar -xzf /backup/knowledge-base/backup_20240110_020000.tar.gz -C /tmp

# 恢复
mongorestore --uri="mongodb://localhost:27017/knowledge-base" /tmp/20240110_020000
```

---

## 故障排查

### 常见问题

#### 1. Docker 容器启动失败

```bash
# 查看详细日志
docker-compose logs backend

# 检查端口占用
lsof -i :5000
lsof -i :3000
lsof -i :27017
```

#### 2. MongoDB 连接失败

- 检查 MongoDB 是否运行: `docker-compose ps mongodb`
- 检查连接字符串是否正确
- 检查网络连接

#### 3. 文件上传失败

- 检查上传目录权限
- 检查文件大小是否超限
- 检查文件类型是否支持

#### 4. 前端无法访问后端

- 检查后端服务是否运行
- 检查代理配置
- 检查 CORS 设置

#### 5. JWT Token 无效

- 检查 JWT_SECRET 是否一致
- 检查 Token 是否过期
- 清除浏览器缓存

### 日志查看

```bash
# Docker 环境
docker-compose logs -f --tail=100 backend

# PM2 环境
pm2 logs knowledge-base-backend --lines 100

# Nginx 日志
sudo tail -f /var/log/nginx/error.log
```

---

## 性能优化

### 1. MongoDB 索引

```javascript
// 确保数据库已创建必要的索引
db.documents.getIndexes()
db.users.getIndexes()
```

### 2. Nginx 缓存配置

```nginx
# 静态资源缓存
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

### 3. Gzip 压缩

已在 Nginx 配置中启用。

### 4. CDN 加速

生产环境建议使用 CDN 加速静态资源访问。

---

## 安全建议

1. **修改默认密码**: 首次部署后立即修改所有默认密码
2. **使用强 JWT Secret**: 生成随机强密钥
3. **启用 HTTPS**: 生产环境必须使用 HTTPS
4. **定期备份**: 设置自动备份策略
5. **限制访问**: 配置防火墙规则
6. **更新依赖**: 定期更新 npm 包
7. **监控日志**: 设置日志监控和告警

---

## 更新升级

### Docker 部署更新

```bash
# 拉取最新代码
git pull

# 重新构建并启动
docker-compose up -d --build

# 清理旧镜像（可选）
docker image prune -a
```

### 本地开发更新

```bash
# 拉取最新代码
git pull

# 更新后端依赖
cd backend
npm install

# 更新前端依赖
cd ../frontend
npm install
```

---

## 技术支持

如有部署问题，请：

1. 查看本文档的故障排查部分
2. 检查系统日志
3. 查看项目 GitHub Issues
4. 联系技术支持团队

---

**版本**: 1.0.0  
**最后更新**: 2024
