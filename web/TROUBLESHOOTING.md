# 故障排查指南

## 问题1: 首页用户头像tab不显示

### 原因
数据库中没有用户被设置为显示状态（`isDisplayed = true`）

### 解决方案

#### 方法1: 使用自动脚本（推荐）
```bash
cd web
node scripts/set-displayed-users.js
```

这个脚本会自动：
- 列出所有用户
- 将前3个有素材的用户设置为显示状态
- 设置显示顺序

#### 方法2: 手动设置（使用数据库）
```sql
-- 查看所有用户
SELECT id, username, email, is_displayed, display_order 
FROM users;

-- 设置特定用户为显示状态
UPDATE users 
SET is_displayed = true, display_order = 1 
WHERE id = 'your-user-id';
```

#### 方法3: 通过API设置
访问管理页面 `/admin` 来管理用户显示设置

---

## 问题2: 用户页面打不开

### 可能的原因和解决方案

#### 1. 检查API端点
```bash
# 测试健康检查
curl http://localhost:3000/api/health

# 测试用户API（替换USER_ID）
curl http://localhost:3000/api/users/USER_ID
```

#### 2. 检查数据库连接
确保 `.env` 文件中的 `DATABASE_URL` 配置正确：
```env
DATABASE_URL="postgresql://user:password@localhost:5432/pincollect"
```

#### 3. 检查用户ID格式
用户页面支持两种访问方式：
- 通过UUID: `/user/123e4567-e89b-12d3-a456-426614174000`
- 通过用户名: `/user/username`

#### 4. 查看浏览器控制台
打开浏览器开发者工具（F12），查看：
- Console标签：查看JavaScript错误
- Network标签：查看API请求是否成功

---

## 问题3: 图片不显示

### 检查清单

#### 1. Cloudinary配置
确保 `.env` 文件中配置了Cloudinary：
```env
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"
```

#### 2. 测试Cloudinary连接
```bash
curl http://localhost:3000/api/health
```
查看 `checks.cloudinary` 是否为 `true`

#### 3. 检查图片URL
在浏览器控制台运行：
```javascript
// 查看首页用户头像
fetch('/api/home/users')
  .then(r => r.json())
  .then(d => console.log(d))

// 查看特定用户信息
fetch('/api/users/USER_ID')
  .then(r => r.json())
  .then(d => console.log(d))
```

#### 4. 图片加载失败降级
现在所有图片组件都有错误处理：
- 头像加载失败会显示首字母
- 封面加载失败会显示渐变背景

---

## 问题4: 点击用户头像无法进入用户页面

### 当前行为
点击右上角的用户头像会直接跳转到用户页面 `/user/USER_ID`

### 如果跳转失败
1. 检查用户是否有ID：
```javascript
// 在浏览器控制台
console.log(session?.user?.id)
```

2. 检查路由是否正确：
- 确保 `web/src/app/user/[userId]/page.tsx` 文件存在
- 重启开发服务器

---

## 调试工具

### 1. 健康检查API
```bash
curl http://localhost:3000/api/health
```

返回示例：
```json
{
  "success": true,
  "status": "healthy",
  "checks": {
    "database": true,
    "cloudinary": true,
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

### 2. 浏览器调试脚本
在浏览器控制台运行 `web/debug-images.js` 中的代码来测试图片加载

### 3. 查看日志
开发服务器会输出详细的错误日志：
```bash
cd web
npm run dev
```

查看控制台输出的错误信息

---

## 常见错误信息

### "User not found"
- 用户ID不存在或格式错误
- 检查数据库中是否有该用户

### "获取用户列表失败"
- 数据库连接问题
- 没有设置 `isDisplayed = true` 的用户

### "Failed to fetch users"
- API端点不可访问
- 检查服务器是否运行

### 图片加载失败
- Cloudinary配置错误
- 图片URL无效
- 网络连接问题

---

## 快速修复命令

```bash
# 1. 重启开发服务器
cd web
npm run dev

# 2. 设置显示用户
node scripts/set-displayed-users.js

# 3. 检查健康状态
curl http://localhost:3000/api/health

# 4. 查看数据库用户
npx prisma studio
```

---

## 需要帮助？

如果问题仍然存在：
1. 检查浏览器控制台的错误信息
2. 检查服务器终端的日志输出
3. 运行健康检查API
4. 查看数据库中的数据是否正确
