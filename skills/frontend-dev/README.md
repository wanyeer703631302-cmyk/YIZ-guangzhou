# Frontend Development Skill

一套完整的前端开发技能系统，涵盖项目初始化、代码规范、构建部署和测试流程。

---

## 目录结构

```
frontend-dev/
├── SKILL.md                    # 技能主文档（详细指南）
├── QUICK_START.md              # 快速开始指南
├── README.md                   # 本文件
├── scripts/
│   ├── init-project.sh         # 项目初始化脚本
│   ├── deploy.sh               # 部署脚本
│   └── update-package-json.js  # package.json 更新脚本
├── templates/
│   ├── .eslintrc.react.cjs     # React ESLint 配置
│   ├── .eslintrc.vue.cjs       # Vue ESLint 配置
│   ├── .prettierrc             # Prettier 配置
│   ├── tailwind.config.js      # Tailwind CSS 配置
│   ├── tsconfig.json           # TypeScript 配置
│   ├── vitest.config.ts        # Vitest 测试配置
│   ├── vitest.setup.ts         # 测试环境设置
│   ├── playwright.config.ts    # Playwright E2E 配置
│   ├── vscode-settings.json    # VS Code 设置
│   ├── vscode-extensions.json  # VS Code 推荐插件
│   ├── ci.yml                  # GitHub Actions CI 配置
│   ├── pre-commit              # Git pre-commit hook
│   ├── gitignore-additions     # .gitignore 追加内容
│   └── README.md               # 项目 README 模板
└── e2e-examples/
    └── example.spec.ts         # E2E 测试示例
```

---

## 支持的框架

| 框架 | 命令 |
|------|------|
| React + Vite | `bash scripts/init-project.sh react my-app` |
| Vue 3 + Vite | `bash scripts/init-project.sh vue my-app` |
| Next.js | `bash scripts/init-project.sh next my-app` |
| Nuxt 3 | `bash scripts/init-project.sh nuxt my-app` |

---

## 核心特性

### 1. 项目初始化
- ✅ 自动创建标准化项目结构
- ✅ 预配置 TypeScript
- ✅ 集成 Tailwind CSS
- ✅ 安装常用依赖和工具

### 2. 代码规范
- ✅ ESLint + Prettier 预配置
- ✅ 自动代码格式化（保存时）
- ✅ Import 自动排序
- ✅ Git Hooks (pre-commit)
- ✅ Conventional Commits

### 3. 测试流程
- ✅ Vitest 单元测试
- ✅ React Testing Library / Vue Test Utils
- ✅ Playwright E2E 测试
- ✅ 代码覆盖率报告
- ✅ CI/CD 集成

### 4. 构建部署
- ✅ Vite 优化构建
- ✅ 多环境配置
- ✅ 静态托管部署
- ✅ Vercel/Netlify 部署
- ✅ Docker 镜像构建

---

## 快速开始

### 创建新项目

```bash
# React 项目
bash /app/.kimi/skills/frontend-dev/scripts/init-project.sh react my-app

cd my-app
npm run dev
```

### 开发工作流

```bash
# 代码检查
npm run lint
npm run lint:fix

# 格式化
npm run format

# 测试
npm run test
npm run test:coverage

# 构建
npm run build
```

### 部署

```bash
# 静态托管
bash /app/.kimi/skills/frontend-dev/scripts/deploy.sh static

# Vercel
bash /app/.kimi/skills/frontend-dev/scripts/deploy.sh vercel

# Docker
bash /app/.kimi/skills/frontend-dev/scripts/deploy.sh docker
```

---

## 项目结构

创建的项目包含以下结构：

```
my-app/
├── public/                 # 静态资源
├── src/
│   ├── assets/            # 图片、字体、样式
│   ├── components/        # 组件
│   │   ├── ui/           # UI 基础组件
│   │   └── common/       # 业务组件
│   ├── hooks/            # 自定义 Hooks
│   ├── stores/           # 状态管理
│   ├── utils/            # 工具函数
│   ├── types/            # TypeScript 类型
│   ├── styles/           # 全局样式
│   └── __tests__/        # 单元测试
├── e2e/                   # E2E 测试
├── .vscode/              # VS Code 配置
├── .husky/               # Git hooks
├── .github/workflows/    # CI/CD 配置
├── docs/                 # 文档
├── dist/                 # 构建输出
└── 配置文件...
```

---

## 配置文件说明

### ESLint 配置
- TypeScript 严格模式
- React/Vue 最佳实践
- Import 排序和检查
- Accessibility 检查

### Prettier 配置
- 单引号
- 2空格缩进
- 100字符行宽
- 自动格式化 Tailwind CSS

### 测试配置
- **Vitest**: 快速单元测试
- **Testing Library**: 组件测试
- **Playwright**: E2E 测试（多浏览器）

### CI/CD 配置
- 自动 Lint 检查
- 自动运行测试
- 自动构建验证
- Playwright 测试报告

---

## Git 工作流

### 提交信息格式

```
<type>(<scope>): <subject>

<body>

<footer>
```

**类型 (type)**:
- `feat`: 新功能
- `fix`: 修复 bug
- `docs`: 文档更新
- `style`: 代码格式（不影响功能）
- `refactor`: 重构
- `test`: 测试相关
- `chore`: 构建/工具相关

**示例**:
```bash
git commit -m "feat(auth): add login form validation"
git commit -m "fix(api): handle 404 error in user endpoint"
git commit -m "docs: update API documentation"
```

### Git Hooks

- **pre-commit**: 自动运行 lint-staged（格式化 + Lint）
- **prepare-commit-msg**: 可选，辅助生成提交信息

---

## 环境变量

### 文件优先级

1. `.env` - 所有环境共享
2. `.env.local` - 本地开发（不提交到 Git）
3. `.env.[mode]` - 特定模式（如 `.env.production`）
4. `.env.[mode].local` - 特定模式本地

### 示例

```bash
# .env
VITE_APP_NAME=MyApp
VITE_API_BASE_URL=/api

# .env.local
VITE_API_MOCK=true
VITE_DEBUG=true

# .env.production
VITE_API_BASE_URL=https://api.example.com
VITE_ANALYTICS_ID=UA-XXXXX
```

---

## VS Code 集成

### 推荐插件

创建项目时会自动配置 `.vscode/extensions.json`，推荐安装：

- **ESLint** - 代码检查
- **Prettier** - 代码格式化
- **Tailwind CSS IntelliSense** - Tailwind 智能提示
- **Auto Rename Tag** - 自动重命名标签
- **Path Intellisense** - 路径智能提示

### 编辑器设置

`.vscode/settings.json` 预配置：
- 保存时自动格式化
- 保存时自动修复 ESLint 错误
- TypeScript 工作区版本
- Tailwind CSS 支持

---

## 故障排除

### 安装失败

```bash
# 清除 npm 缓存
npm cache clean --force

# 使用国内镜像
npm config set registry https://registry.npmmirror.com
```

### 构建失败

```bash
# 检查类型错误
npx tsc --noEmit

# 检查 ESLint 错误
npm run lint

# 清除缓存重新构建
rm -rf node_modules dist
npm install
npm run build
```

### 测试失败

```bash
# 更新快照
npm run test -- -u

# 运行单个测试文件
npm run test -- src/components/Button.test.tsx

# 调试模式
npm run test -- --reporter=verbose
```

---

## 扩展和定制

### 添加新框架支持

1. 创建新的 ESLint 配置模板 `templates/.eslintrc.[framework].cjs`
2. 在 `init-project.sh` 中添加框架初始化函数
3. 更新 `SKILL.md` 文档

### 自定义组件模板

修改 `init-project.sh` 中的组件模板代码。

### 添加新的部署目标

修改 `scripts/deploy.sh`，添加新的部署函数。

---

## 最佳实践

### 组件设计
- 保持组件小而专注（< 200 行）
- 使用组合而非继承
- 提取可复用逻辑到自定义 Hooks
- 使用 TypeScript 定义所有 Props

### 状态管理
- 从本地状态开始（useState/ref）
- 使用 Context 管理全局状态（主题、认证）
- 复杂状态考虑 Pinia/Zustand
- 避免超过 3 层的 prop drilling

### 性能优化
- 使用 `React.memo` / `defineComponent` 优化纯组件
- 路由和重型组件懒加载
- 图片优化（WebP、懒加载）
- 长列表使用虚拟滚动

### 可访问性
- 使用语义化 HTML 元素
- 添加 `aria-*` 属性
- 确保键盘导航
- 使用屏幕阅读器测试

---

## 更新日志

### v1.0.0
- ✅ 支持 React/Vue/Next/Nuxt 框架
- ✅ 完整的 ESLint + Prettier 配置
- ✅ Vitest + Playwright 测试集成
- ✅ Git Hooks + Conventional Commits
- ✅ 多目标部署支持
- ✅ VS Code 集成
- ✅ GitHub Actions CI/CD

---

## 参考资源

- [Vite Documentation](https://vitejs.dev/)
- [React Documentation](https://react.dev/)
- [Vue Documentation](https://vuejs.org/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)
- [Tailwind CSS Documentation](https://tailwindcss.com/)
- [Conventional Commits](https://www.conventionalcommits.org/)

---

## 许可证

MIT
