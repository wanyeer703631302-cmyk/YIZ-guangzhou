# Frontend Development Skill - 索引

## 📚 文档导航

| 文档 | 说明 |
|------|------|
| [SKILL.md](./SKILL.md) | **技能主文档** - 完整的功能说明和使用指南 |
| [QUICK_START.md](./QUICK_START.md) | **快速开始** - 5分钟上手 |
| [README.md](./README.md) | **项目介绍** - 系统概述和目录结构 |
| [USAGE_EXAMPLE.md](./USAGE_EXAMPLE.md) | **使用示例** - 实际场景案例 |

---

## 🚀 快速命令

### 创建项目

```bash
# React
bash /app/.kimi/skills/frontend-dev/scripts/init-project.sh react my-app

# Vue
bash /app/.kimi/skills/frontend-dev/scripts/init-project.sh vue my-app

# Next.js
bash /app/.kimi/skills/frontend-dev/scripts/init-project.sh next my-app

# Nuxt
bash /app/.kimi/skills/frontend-dev/scripts/init-project.sh nuxt my-app
```

### 开发命令

```bash
cd my-app

npm run dev          # 启动开发服务器
npm run lint         # 代码检查
npm run lint:fix     # 自动修复
npm run format       # 格式化代码
npm run test         # 运行测试
npm run test:e2e     # E2E 测试
npm run build        # 构建生产版本
```

### 部署命令

```bash
bash /app/.kimi/skills/frontend-dev/scripts/deploy.sh static   # 静态托管
bash /app/.kimi/skills/frontend-dev/scripts/deploy.sh vercel   # Vercel
bash /app/.kimi/skills/frontend-dev/scripts/deploy.sh netlify  # Netlify
bash /app/.kimi/skills/frontend-dev/scripts/deploy.sh docker   # Docker
```

---

## 📁 文件结构

```
frontend-dev/
├── 📄 SKILL.md                    # 技能主文档
├── 📄 QUICK_START.md              # 快速开始指南
├── 📄 README.md                   # 项目介绍
├── 📄 USAGE_EXAMPLE.md            # 使用示例
├── 📄 INDEX.md                    # 本文件
│
├── 📁 scripts/                    # 脚本工具
│   ├── init-project.sh            # 项目初始化
│   ├── deploy.sh                  # 部署脚本
│   └── update-package-json.js     # package.json 更新
│
├── 📁 templates/                  # 配置文件模板
│   ├── .eslintrc.react.cjs        # React ESLint
│   ├── .eslintrc.vue.cjs          # Vue ESLint
│   ├── .prettierrc                # Prettier 配置
│   ├── tailwind.config.js         # Tailwind CSS
│   ├── tsconfig.json              # TypeScript
│   ├── vitest.config.ts           # Vitest 测试
│   ├── vitest.setup.ts            # 测试环境
│   ├── playwright.config.ts       # E2E 测试
│   ├── vscode-settings.json       # VS Code 设置
│   ├── vscode-extensions.json     # VS Code 插件
│   ├── ci.yml                     # GitHub Actions
│   ├── pre-commit                 # Git Hook
│   ├── gitignore-additions        # .gitignore
│   └── README.md                  # 项目 README 模板
│
└── 📁 e2e-examples/               # E2E 测试示例
    └── example.spec.ts
```

---

## ✨ 核心特性

### 1. 项目初始化
- ✅ 一键创建标准化项目
- ✅ 支持 React/Vue/Next/Nuxt
- ✅ 自动安装依赖和配置

### 2. 代码规范
- ✅ ESLint + Prettier
- ✅ 自动格式化
- ✅ Git Hooks
- ✅ Conventional Commits

### 3. 测试流程
- ✅ Vitest 单元测试
- ✅ React Testing Library
- ✅ Playwright E2E
- ✅ 代码覆盖率

### 4. 构建部署
- ✅ Vite 优化构建
- ✅ 多环境配置
- ✅ 静态/Vercel/Netlify/Docker

---

## 🎯 使用场景

| 场景 | 参考文档 |
|------|----------|
| 个人项目快速启动 | [QUICK_START.md](./QUICK_START.md) |
| 团队项目协作 | [USAGE_EXAMPLE.md](./USAGE_EXAMPLE.md) |
| 企业级应用开发 | [SKILL.md](./SKILL.md) |
| 自定义 SKILL | [USAGE_EXAMPLE.md](./USAGE_EXAMPLE.md) |

---

## 📖 学习路径

### 新手入门
1. 阅读 [QUICK_START.md](./QUICK_START.md)
2. 创建一个测试项目
3. 熟悉开发命令

### 进阶使用
1. 阅读 [SKILL.md](./SKILL.md)
2. 了解配置细节
3. 自定义项目模板

### 团队应用
1. 阅读 [USAGE_EXAMPLE.md](./USAGE_EXAMPLE.md)
2. 设置 CI/CD
3. 建立团队规范

---

## 🔧 自定义扩展

### 添加新框架
1. 创建 `templates/.eslintrc.[framework].cjs`
2. 在 `init-project.sh` 添加初始化函数
3. 更新文档

### 自定义组件模板
编辑 `init-project.sh` 中的组件代码模板

### 添加部署目标
编辑 `scripts/deploy.sh` 添加新的部署函数

---

## 💡 最佳实践

1. **项目初始化** → 使用脚本，保持一致性
2. **代码规范** → 自动化检查，减少人工
3. **测试覆盖** → 单元 + E2E，保证质量
4. **Git 工作流** → 规范提交，清晰历史
5. **CI/CD** → 自动化测试和部署
6. **环境管理** → .env 文件，分离配置

---

## 📞 问题反馈

遇到问题？
1. 查看 [SKILL.md](./SKILL.md) 的故障排除章节
2. 参考 [USAGE_EXAMPLE.md](./USAGE_EXAMPLE.md) 的常见问题
3. 检查配置文件是否正确

---

## 📄 许可证

MIT License
