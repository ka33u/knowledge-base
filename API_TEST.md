# API 测试示例

本文档提供了一些API测试的curl命令示例，方便您快速测试系统功能。

## 前置条件

系统已启动运行，可通过以下命令启动：

```bash
cd knowledge-base
./start.sh
```

## 认证相关

### 用户注册

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "Test@123"
  }'
```

### 用户登录

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@knowledge-base.com",
    "password": "Admin@123"
  }'
```

响应示例：
```json
{
  "success": true,
  "message": "登录成功",
  "data": {
    "user": {
      "id": "...",
      "username": "admin",
      "email": "admin@knowledge-base.com",
      "role": "admin"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

保存返回的token，后续请求需要在Header中携带：

```bash
export TOKEN="your-token-here"
```

### 获取当前用户信息

```bash
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer $TOKEN"
```

## 文档相关

### 获取文档列表

```bash
curl -X GET "http://localhost:5000/api/documents?page=1&limit=10" \
  -H "Authorization: Bearer $TOKEN"
```

### 获取文档详情

```bash
curl -X GET http://localhost:5000/api/documents/{documentId} \
  -H "Authorization: Bearer $TOKEN"
```

### 创建文档（上传文件）

```bash
curl -X POST http://localhost:5000/api/documents \
  -H "Authorization: Bearer $TOKEN" \
  -F "title=测试文档" \
  -F "description=这是一个测试文档" \
  -F "category={categoryId}" \
  -F "tags[]=测试" \
  -F "tags[]=示例" \
  -F "file=@/path/to/your/file.pdf"
```

### 更新文档

```bash
curl -X PUT http://localhost:5000/api/documents/{documentId} \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "更新后的标题",
    "description": "更新后的描述"
  }'
```

### 提交审核

```bash
curl -X POST http://localhost:5000/api/documents/{documentId}/submit \
  -H "Authorization: Bearer $TOKEN"
```

### 审核文档

```bash
curl -X PUT http://localhost:5000/api/documents/{documentId}/review \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "approved": true,
    "comment": "审核通过"
  }'
```

### 搜索文档

```bash
curl -X GET "http://localhost:5000/api/documents/search?q=测试" \
  -H "Authorization: Bearer $TOKEN"
```

### 删除文档

```bash
curl -X DELETE http://localhost:5000/api/documents/{documentId} \
  -H "Authorization: Bearer $TOKEN"
```

## 分类相关

### 获取分类列表

```bash
curl -X GET http://localhost:5000/api/categories \
  -H "Authorization: Bearer $TOKEN"
```

### 创建分类

```bash
curl -X POST http://localhost:5000/api/categories \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "测试分类",
    "description": "这是一个测试分类",
    "color": "#1890ff",
    "sortOrder": 1
  }'
```

### 更新分类

```bash
curl -X PUT http://localhost:5000/api/categories/{categoryId} \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "更新后的分类名称"
  }'
```

### 删除分类

```bash
curl -X DELETE http://localhost:5000/api/categories/{categoryId} \
  -H "Authorization: Bearer $TOKEN"
```

## 用户相关

### 获取用户列表

```bash
curl -X GET "http://localhost:5000/api/users?page=1&limit=10" \
  -H "Authorization: Bearer $TOKEN"
```

### 获取用户详情

```bash
curl -X GET http://localhost:5000/api/users/{userId} \
  -H "Authorization: Bearer $TOKEN"
```

### 更新用户

```bash
curl -X PUT http://localhost:5000/api/users/{userId} \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newemail@example.com",
    "role": "editor",
    "isActive": true
  }'
```

### 删除用户

```bash
curl -X DELETE http://localhost:5000/api/users/{userId} \
  -H "Authorization: Bearer $TOKEN"
```

## 审核日志

### 获取审核日志

```bash
curl -X GET "http://localhost:5000/api/audit-logs?page=1&limit=10" \
  -H "Authorization: Bearer $TOKEN"
```

### 获取文档审核历史

```bash
curl -X GET http://localhost:5000/api/audit-logs/document/{documentId} \
  -H "Authorization: Bearer $TOKEN"
```

## 使用 Postman

推荐使用 Postman 进行API测试：

1. 导入以下环境变量：
   - `base_url`: http://localhost:5000
   - `token`: 登录后获取的token

2. 配置Authorization：
   - Type: Bearer Token
   - Token: `{{token}}`

3. 创建Collection，按功能模块组织API请求

## 常见错误码

| 状态码 | 说明 |
|--------|------|
| 200 | 请求成功 |
| 201 | 创建成功 |
| 400 | 请求参数错误 |
| 401 | 未授权（token无效或过期） |
| 403 | 权限不足 |
| 404 | 资源不存在 |
| 409 | 资源已存在 |
| 500 | 服务器内部错误 |

## 注意事项

1. 所有需要认证的API都需要在Header中携带有效的token
2. token默认有效期为7天
3. 文件上传使用multipart/form-data格式
4. 分页参数：page（页码，从1开始）、limit（每页数量，最大100）
5. 删除操作不可恢复，请谨慎操作

---

**更多API文档**: http://localhost:5000/api-docs
