# Frontend Development Skill - Quick Start

## 1. 初始化项目

```bash
# React 项目
bash /app/.kimi/skills/frontend-dev/scripts/init-project.sh react my-react-app

# Vue 项目
bash /app/.kimi/skills/frontend-dev/scripts/init-project.sh vue my-vue-app

# Next.js 项目
bash /app/.kimi/skills/frontend-dev/scripts/init-project.sh next my-next-app

# Nuxt 项目
bash /app/.kimi/skills/frontend-dev/scripts/init-project.sh nuxt my-nuxt-app
```

## 2. 开发工作流

```bash
cd my-react-app

# 启动开发服务器
npm run dev

# 代码检查
npm run lint
npm run lint:fix

# 格式化代码
npm run format

# 类型检查
npm run type-check
```

## 3. 测试

```bash
# 单元测试
npm run test

# 单元测试（监视模式）
npm run test:watch

# 测试覆盖率
npm run test:coverage

# E2E 测试
npm run test:e2e
```

## 4. 构建部署

```bash
# 构建生产版本
npm run build

# 预览生产构建
npm run preview

# 部署（静态托管）
bash /app/.kimi/skills/frontend-dev/scripts/deploy.sh static

# 部署到 Vercel
bash /app/.kimi/skills/frontend-dev/scripts/deploy.sh vercel

# 部署到 Netlify
bash /app/.kimi/skills/frontend-dev/scripts/deploy.sh netlify

# 构建 Docker 镜像
bash /app/.kimi/skills/frontend-dev/scripts/deploy.sh docker
```

## 5. Git 工作流

```bash
# 提交前会自动运行 lint 和 type-check
git add .
git commit -m "feat: add new feature"

# 提交信息格式
# feat: 新功能
# fix: 修复 bug
# docs: 文档更新
# style: 代码格式
# refactor: 重构
# test: 测试
# chore: 构建/工具
```

## 6. 项目结构

```
my-app/
├── src/
│   ├── components/      # 组件
│   │   ├── ui/         # UI 基础组件
│   │   └── common/     # 业务组件
│   ├── hooks/          # 自定义 Hooks
│   ├── stores/         # 状态管理
│   ├── utils/          # 工具函数
│   ├── types/          # TypeScript 类型
│   ├── styles/         # 全局样式
│   └── __tests__/      # 单元测试
├── e2e/                # E2E 测试
├── public/             # 静态资源
├── docs/               # 文档
└── dist/               # 构建输出
```

## 7. 代码规范

### ESLint 规则
- TypeScript 严格模式
- React/Vue 最佳实践
- Import 排序
- Accessibility 检查

### Prettier 配置
- 单引号
- 2空格缩进
- 100字符行宽
- 尾随逗号 (ES5)

### Git Hooks
- **pre-commit**: 自动格式化 + Lint
- **commit-msg**: 提交信息格式检查

## 8. 环境变量

```bash
# .env (共享)
VITE_APP_NAME=MyApp
VITE_API_BASE_URL=/api

# .env.local (本地，不提交)
VITE_API_MOCK=true

# .env.production (生产)
VITE_API_BASE_URL=https://api.example.com
```

## 9. VS Code 推荐插件

安装以下插件获得最佳开发体验：

- **ESLint** - 代码检查
- **Prettier** - 代码格式化
- **Tailwind CSS IntelliSense** - Tailwind 提示
- **Auto Rename Tag** - 自动重命名标签
- **Path Intellisense** - 路径提示

## 10. 故障排除

### 构建失败
```bash
# 清除缓存重新安装
rm -rf node_modules dist
npm install
npm run build
```

### 类型错误
```bash
# 检查所有类型
npx tsc --noEmit
```

### 测试失败
```bash
# 更新快照
npm run test -- -u

# 调试单个测试
npm run test -- src/components/Button.test.tsx
```
