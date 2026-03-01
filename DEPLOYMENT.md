# 部署指南

本文档详细说明如何将YIZ Gallery部署到Vercel平台。

## 前置要求

在开始部署之前，请确保你已经：

- ✅ 拥有 [Vercel](https://vercel.com) 账号
- ✅ 拥有 [GitHub](https://github.com) 账号（推荐）
- ✅ 准备好PostgreSQL数据库
- ✅ 拥有 [Cloudinary](https://cloudinary.com) 账号

## 第一步：准备数据库

### 选项1：使用Vercel Postgres（推荐）

1. 登录 [Vercel Dashboard](https://vercel.com/dashboard)
2. 进入你的项目
3. 点击 "Storage" 标签
4. 点击 "Create Database"
5. 选择 "Postgres"
6. 选择区域（建议选择离用户最近的区域）
7. 点击 "Create"
8. 复制 `DATABASE_URL` 连接字符串

### 选项2：使用Supabase

1. 访问 [Supabase](https://supabase.com)
2. 创建新项目
3. 等待数据库初始化完成
4. 进入 "Settings" > "Database"
5. 复制 "Connection string" 中的 "URI" 格式连接字符串
6. 将 `[YOUR-PASSWORD]` 替换为你设置的密码

### 选项3：使用Railway

1. 访问 [Railway](https://railway.app)
2. 创建新项目
3. 添加 "PostgreSQL" 服务
4. 进入PostgreSQL服务
5. 在 "Connect" 标签中复制 "Postgres Connection URL"

## 第二步：配置Cloudinary

1. 访问 [Cloudinary](https://cloudinary.com) 并登录
2. 进入 Dashboard
3. 记录以下信息：
   - **Cloud Name**: 显示在页面顶部
   - **API Key**: 在 "Account Details" 部分
   - **API Secret**: 点击 "API Secret" 旁边的眼睛图标查看

## 第三步：生成JWT密钥

在本地终端运行以下命令生成随机密钥：

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

复制输出的字符串，这将作为你的 `JWT_SECRET`。

## 第四步：部署到Vercel

### 方法1：通过GitHub自动部署（推荐）

1. **将代码推送到GitHub**

```bash
# 初始化Git仓库（如果还没有）
git init

# 添加所有文件
git add .

# 提交
git commit -m "Initial commit"

# 添加远程仓库
git remote add origin https://github.com/your-username/your-repo.git

# 推送到GitHub
git push -u origin main
```

2. **在Vercel中导入项目**

- 访问 [Vercel Dashboard](https://vercel.com/dashboard)
- 点击 "Add New..." > "Project"
- 选择你的GitHub仓库
- 点击 "Import"

3. **配置项目**

Vercel会自动检测项目配置，确认以下设置：

- **Framework Preset**: Other
- **Root Directory**: `./`
- **Build Command**: `npm run vercel-build`
- **Output Directory**: `app/dist`
- **Install Command**: `npm install`

4. **配置环境变量**

在 "Environment Variables" 部分添加以下变量：

| 变量名 | 值 | 环境 |
|--------|-----|------|
| `DATABASE_URL` | 你的PostgreSQL连接字符串 | Production, Preview, Development |
| `CLOUDINARY_CLOUD_NAME` | 你的Cloudinary云名称 | Production, Preview, Development |
| `CLOUDINARY_API_KEY` | 你的Cloudinary API密钥 | Production, Preview, Development |
| `CLOUDINARY_API_SECRET` | 你的Cloudinary API密钥 | Production, Preview, Development |
| `JWT_SECRET` | 你生成的JWT密钥 | Production, Preview, Development |

5. **部署**

点击 "Deploy" 按钮开始部署。

### 方法2：使用Vercel CLI

1. **安装Vercel CLI**

```bash
npm i -g vercel
```

2. **登录Vercel**

```bash
vercel login
```

3. **部署项目**

```bash
# 首次部署（会提示配置项目）
vercel

# 按照提示操作：
# - Set up and deploy? Yes
# - Which scope? 选择你的账号
# - Link to existing project? No
# - What's your project's name? yiz-gallery
# - In which directory is your code located? ./
```

4. **配置环境变量**

```bash
# 添加环境变量
vercel env add DATABASE_URL
vercel env add CLOUDINARY_CLOUD_NAME
vercel env add CLOUDINARY_API_KEY
vercel env add CLOUDINARY_API_SECRET
vercel env add JWT_SECRET

# 每个命令会提示你输入值和选择环境（Production, Preview, Development）
```

5. **部署到生产环境**

```bash
vercel --prod
```

## 第五步：运行数据库迁移

部署完成后，需要运行数据库迁移来创建表结构。

### 方法1：使用Vercel CLI

```bash
# 拉取生产环境变量到本地
vercel env pull .env.production

# 运行迁移
DATABASE_URL=$(grep DATABASE_URL .env.production | cut -d '=' -f2-) npx prisma migrate deploy
```

### 方法2：在Vercel Dashboard中运行

1. 进入项目的 "Settings" > "Environment Variables"
2. 确保 `DATABASE_URL` 已配置
3. 进入 "Deployments" 标签
4. 找到最新的部署
5. 点击 "..." > "Redeploy"
6. 选择 "Use existing Build Cache"

迁移会在构建过程中自动运行（通过 `vercel-build` 脚本）。

## 第六步：验证部署

### 1. 检查健康状态

访问你的部署域名的健康检查端点：

```
https://your-domain.vercel.app/api/health
```

应该返回类似以下的响应：

```json
{
  "status": "ok",
  "services": {
    "database": "connected",
    "cloudinary": "configured"
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### 2. 测试前端

访问你的部署域名：

```
https://your-domain.vercel.app
```

确认：
- ✅ 页面正常加载
- ✅ 3D网格效果正常显示
- ✅ 没有控制台错误

### 3. 测试用户注册

1. 点击注册按钮
2. 填写邮箱、密码和姓名
3. 提交表单
4. 确认注册成功并自动登录

### 4. 测试图片上传

1. 确保已登录
2. 点击上传按钮
3. 选择或拖拽图片文件
4. 确认上传成功
5. 验证图片出现在画廊中

### 5. 测试交互功能

1. 点击图片的点赞按钮
2. 点击图片的收藏按钮
3. 刷新页面
4. 确认点赞和收藏状态保持

## 环境变量详细说明

### DATABASE_URL

PostgreSQL数据库连接字符串，格式：

```
postgresql://username:password@host:port/database?schema=public
```

**示例：**
```
postgresql://user:pass123@db.example.com:5432/yiz_gallery?schema=public
```

**注意事项：**
- 确保数据库支持SSL连接（生产环境推荐）
- 如果使用连接池，添加 `?pgbouncer=true` 参数
- Vercel Postgres会自动添加必要的参数

### CLOUDINARY_CLOUD_NAME

你的Cloudinary云名称，在Dashboard顶部显示。

**示例：** `my-cloud-name`

### CLOUDINARY_API_KEY

Cloudinary API密钥，15位数字。

**示例：** `123456789012345`

### CLOUDINARY_API_SECRET

Cloudinary API密钥，字母数字组合。

**示例：** `abcdefghijklmnopqrstuvwxyz123456`

**安全提示：** 不要将此密钥提交到Git仓库或公开分享。

### JWT_SECRET

用于签名JWT令牌的密钥，建议使用至少32字节的随机字符串。

**生成方法：**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**示例：** `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6`

**安全提示：** 
- 不要使用简单的字符串
- 不要在多个环境使用相同的密钥
- 定期更换密钥（会使现有令牌失效）

## 常见问题

### 部署失败：Build Error

**问题：** 构建过程中出错

**解决方案：**
1. 检查 `vercel.json` 配置是否正确
2. 确保所有依赖都在 `package.json` 中
3. 检查构建日志中的具体错误信息
4. 尝试在本地运行 `npm run vercel-build`

### 数据库连接失败

**问题：** API返回数据库连接错误

**解决方案：**
1. 检查 `DATABASE_URL` 是否正确配置
2. 确认数据库服务正在运行
3. 检查数据库防火墙设置，允许Vercel IP访问
4. 验证数据库用户权限
5. 尝试在本地使用相同的连接字符串

### Prisma迁移失败

**问题：** 数据库表未创建

**解决方案：**
1. 手动运行迁移：
   ```bash
   vercel env pull .env.production
   DATABASE_URL=$(grep DATABASE_URL .env.production | cut -d '=' -f2-) npx prisma migrate deploy
   ```
2. 检查 `prisma/migrations` 目录是否存在
3. 确认 `vercel-build` 脚本包含 `prisma:migrate`
4. 查看部署日志中的迁移输出

### Cloudinary上传失败

**问题：** 图片上传返回错误

**解决方案：**
1. 验证Cloudinary配置信息是否正确
2. 检查API密钥是否有效（未过期）
3. 确认Cloudinary账号未超出配额
4. 检查文件大小是否超过10MB限制
5. 验证文件类型是否为图片格式

### JWT认证失败

**问题：** 登录后仍然提示未认证

**解决方案：**
1. 检查 `JWT_SECRET` 是否已配置
2. 清除浏览器localStorage
3. 检查令牌是否过期（默认7天）
4. 验证前端是否正确发送Authorization头
5. 检查后端是否正确验证令牌

### API路由404错误

**问题：** 访问API端点返回404

**解决方案：**
1. 检查 `vercel.json` 中的路由配置
2. 确认API文件在 `api/` 目录中
3. 验证文件名和路由路径匹配
4. 检查函数是否正确导出
5. 查看Vercel部署日志中的函数列表

## 更新部署

### 自动部署（GitHub集成）

如果使用GitHub集成，每次推送到主分支都会自动触发部署：

```bash
git add .
git commit -m "Update feature"
git push origin main
```

### 手动部署（Vercel CLI）

```bash
# 部署到预览环境
vercel

# 部署到生产环境
vercel --prod
```

## 回滚部署

如果新部署出现问题，可以快速回滚：

1. 进入 [Vercel Dashboard](https://vercel.com/dashboard)
2. 选择你的项目
3. 进入 "Deployments" 标签
4. 找到之前的稳定版本
5. 点击 "..." > "Promote to Production"

## 监控和日志

### 查看实时日志

```bash
vercel logs your-deployment-url
```

### 在Dashboard中查看

1. 进入项目的 "Deployments" 标签
2. 点击具体的部署
3. 查看 "Build Logs" 和 "Function Logs"

### 设置告警

1. 进入项目的 "Settings" > "Notifications"
2. 配置部署失败通知
3. 配置性能告警

## 性能优化

### 启用边缘缓存

在 `vercel.json` 中配置缓存：

```json
{
  "headers": [
    {
      "source": "/api/assets",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "s-maxage=60, stale-while-revalidate"
        }
      ]
    }
  ]
}
```

### 优化图片加载

Cloudinary会自动优化图片，确保使用：
- 自动格式转换（WebP、AVIF）
- 响应式图片尺寸
- 延迟加载

### 数据库连接池

使用Prisma的连接池功能，在 `lib/prisma.ts` 中配置：

```typescript
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
})
```

## 安全建议

1. **定期更新依赖**
   ```bash
   npm audit
   npm update
   ```

2. **使用环境变量**
   - 永远不要在代码中硬编码密钥
   - 使用Vercel的环境变量管理

3. **启用HTTPS**
   - Vercel自动提供HTTPS
   - 确保所有API调用使用HTTPS

4. **限制API访问**
   - 实现速率限制
   - 验证所有输入
   - 使用CORS配置

5. **定期备份数据库**
   - 配置自动备份
   - 定期测试恢复流程

## 支持

如果遇到问题：

1. 查看 [Vercel文档](https://vercel.com/docs)
2. 查看 [Prisma文档](https://www.prisma.io/docs)
3. 查看项目的GitHub Issues
4. 联系项目维护者

## 下一步

部署成功后，你可以：

- 配置自定义域名
- 设置分析和监控
- 优化性能和SEO
- 添加更多功能
- 配置CI/CD流程

祝你部署顺利！🚀
