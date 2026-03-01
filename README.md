# YIZ Gallery - 3D图片画廊

一个全栈3D图片画廊应用，具有网格畸变效果、用户认证、图片上传和交互功能。

## 技术栈

### 前端
- **React 18** + TypeScript
- **Vite** - 快速构建工具
- **Three.js** - 3D渲染引擎
- **TailwindCSS** + shadcn/ui - UI组件库
- **Framer Motion** - 动画库

### 后端
- **Vercel Serverless Functions** - API端点
- **Express.js** + TypeScript - 后端框架
- **Prisma ORM** - 数据库ORM
- **PostgreSQL** - 关系型数据库
- **Cloudinary** - 图片存储和CDN
- **JWT** - 用户认证

## 项目结构

```
project-root/
├── app/                          # 前端应用
│   ├── src/
│   │   ├── components/          # React组件
│   │   ├── hooks/               # 自定义Hooks
│   │   ├── lib/                 # 工具库
│   │   ├── services/            # API服务层
│   │   │   ├── api.ts          # API客户端
│   │   │   ├── auth.ts         # 认证服务
│   │   │   └── upload.ts       # 上传服务
│   │   ├── types/               # TypeScript类型
│   │   └── utils/               # 工具函数
│   ├── public/                  # 静态资源
│   └── package.json
│
├── api/                          # Serverless Functions
│   ├── assets.ts                # 资源管理API
│   ├── auth.ts                  # 认证API
│   ├── health.ts                # 健康检查
│   ├── likes.ts                 # 点赞API
│   ├── favorites.ts             # 收藏API
│   └── upload.ts                # 上传API
│
├── prisma/                       # 数据库配置
│   ├── schema.prisma            # 数据模型
│   └── migrations/              # 迁移脚本
│
├── lib/                          # 共享库
│   ├── prisma.ts                # Prisma客户端
│   ├── cloudinary.ts            # Cloudinary配置
│   └── auth.ts                  # 认证工具
│
├── .env.example                  # 环境变量模板
├── vercel.json                   # Vercel配置
├── package.json                  # 根package.json
└── README.md
```

## 功能特性

- ✨ **3D网格畸变效果** - 基于Three.js的炫酷3D展示
- 🖼️ **图片上传** - 支持拖拽上传，自动上传到Cloudinary
- 👤 **用户认证** - JWT令牌认证，安全可靠
- ❤️ **点赞和收藏** - 用户交互功能，数据持久化
- 📱 **响应式设计** - 适配各种屏幕尺寸
- 🚀 **Serverless架构** - 基于Vercel的无服务器部署

## 环境变量配置

在项目根目录创建 `.env` 文件，参考 `.env.example`：

```env
# 数据库连接
DATABASE_URL="postgresql://user:password@host:5432/database?schema=public"

# Cloudinary配置
CLOUDINARY_CLOUD_NAME="your_cloud_name"
CLOUDINARY_API_KEY="your_api_key"
CLOUDINARY_API_SECRET="your_api_secret"

# JWT密钥（生成一个随机字符串）
JWT_SECRET="your_jwt_secret_key_here"

# 前端API地址（开发环境）
VITE_API_URL="http://localhost:3000/api"
```

### 获取配置信息

1. **PostgreSQL数据库**
   - 推荐使用 [Vercel Postgres](https://vercel.com/docs/storage/vercel-postgres)
   - 或使用 [Supabase](https://supabase.com/)、[Railway](https://railway.app/) 等服务

2. **Cloudinary账号**
   - 访问 [Cloudinary](https://cloudinary.com/) 注册免费账号
   - 在Dashboard中找到Cloud Name、API Key和API Secret

3. **JWT密钥**
   - 生成随机字符串：`node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

## 本地开发

### 1. 安装依赖

```bash
npm install
cd app && npm install && cd ..
```

### 2. 配置环境变量

复制 `.env.example` 为 `.env` 并填写配置信息：

```bash
cp .env.example .env
```

### 3. 初始化数据库

```bash
# 生成Prisma客户端
npm run prisma:generate

# 运行数据库迁移
npm run prisma:migrate:dev

# （可选）打开Prisma Studio查看数据
npm run prisma:studio
```

### 4. 启动开发服务器

```bash
# 同时启动前端和后端
npm run dev

# 或分别启动
npm run dev:frontend  # 前端: http://localhost:5173
npm run dev:api       # 后端: http://localhost:3000
```

### 5. 访问应用

打开浏览器访问 [http://localhost:5173](http://localhost:5173)

## 测试

```bash
# 运行所有测试
npm test

# 运行测试并监听文件变化
npm run test:watch

# 运行属性测试
npm run test:property

# 生成测试覆盖率报告
npm run test:coverage
```

## 部署到Vercel

### 1. 准备工作

确保你已经：
- 创建了Vercel账号
- 安装了Vercel CLI：`npm i -g vercel`
- 准备好了PostgreSQL数据库
- 准备好了Cloudinary账号

### 2. 配置环境变量

在Vercel项目设置中添加以下环境变量：

| 变量名 | 说明 | 示例 |
|--------|------|------|
| `DATABASE_URL` | PostgreSQL连接字符串 | `postgresql://...` |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary云名称 | `your_cloud_name` |
| `CLOUDINARY_API_KEY` | Cloudinary API密钥 | `123456789012345` |
| `CLOUDINARY_API_SECRET` | Cloudinary API密钥 | `abcdefghijklmnop` |
| `JWT_SECRET` | JWT签名密钥 | `random_secret_key` |

### 3. 部署

```bash
# 首次部署
vercel

# 部署到生产环境
vercel --prod
```

### 4. 运行数据库迁移

部署后，在Vercel项目设置中运行：

```bash
npm run prisma:migrate
```

或者使用Vercel CLI：

```bash
vercel env pull .env.production
npm run prisma:migrate
```

### 5. 验证部署

访问你的Vercel域名，检查：
- 前端页面正常加载
- API健康检查：`https://your-domain.vercel.app/api/health`
- 用户注册和登录功能
- 图片上传功能

## API端点

### 健康检查
- `GET /api/health` - 检查服务状态

### 认证
- `POST /api/auth/register` - 用户注册
- `POST /api/auth/login` - 用户登录
- `GET /api/auth/session` - 获取当前会话

### 资源管理
- `GET /api/assets` - 获取资源列表（支持分页和筛选）
- `POST /api/upload` - 上传图片（需要认证）

### 交互功能
- `POST /api/likes` - 创建点赞（需要认证）
- `DELETE /api/likes/:id` - 删除点赞（需要认证）
- `POST /api/favorites` - 创建收藏（需要认证）
- `DELETE /api/favorites/:id` - 删除收藏（需要认证）
- `GET /api/user/interactions` - 获取用户交互数据（需要认证）

## 常见问题

### 数据库连接失败

确保：
1. `DATABASE_URL` 格式正确
2. 数据库服务正在运行
3. 网络连接正常
4. 已运行 `npm run prisma:generate`

### Cloudinary上传失败

确保：
1. Cloudinary配置信息正确
2. API密钥有效
3. 文件大小不超过10MB
4. 文件格式为图片类型

### JWT认证失败

确保：
1. `JWT_SECRET` 已配置
2. 令牌未过期（有效期7天）
3. 请求头包含正确的Authorization字段

## 开发指南

### 添加新的API端点

1. 在 `api/` 目录创建新文件
2. 导出默认的请求处理函数
3. 使用 `withAuth` 中间件保护需要认证的端点

```typescript
// api/example.ts
import { VercelRequest, VercelResponse } from '@vercel/node'
import { withAuth } from '../lib/auth'

export default withAuth(async (req: VercelRequest, res: VercelResponse) => {
  // 处理请求
  res.json({ success: true, data: 'Hello World' })
})
```

### 添加新的数据模型

1. 编辑 `prisma/schema.prisma`
2. 运行 `npm run prisma:migrate:dev`
3. 更新TypeScript类型定义

### 前端调用API

使用 `apiClient` 服务：

```typescript
import { apiClient } from '@/services/api'

// 获取资源列表
const result = await apiClient.getAssets({ page: 1, limit: 20 })

if (result.success) {
  console.log(result.data)
} else {
  console.error(result.error)
}
```

## 贡献指南

欢迎提交Issue和Pull Request！

## 许可证

MIT License

## 联系方式

如有问题，请提交Issue或联系项目维护者。
