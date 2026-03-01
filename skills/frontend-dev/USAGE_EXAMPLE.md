# 使用示例

本文档展示如何使用这套前端开发技能系统完成实际项目。

---

## 场景 1: 创建一个 React 电商后台管理系统

### Step 1: 初始化项目

```bash
bash /app/.kimi/skills/frontend-dev/scripts/init-project.sh react admin-dashboard

cd admin-dashboard
```

### Step 2: 添加业务依赖

```bash
# UI 组件库
npm install @radix-ui/react-dialog @radix-ui/react-dropdown-menu
npm install @radix-ui/react-table @radix-ui/react-tabs

# 数据获取
npm install @tanstack/react-query axios

# 表单处理
npm install react-hook-form zod @hookform/resolvers

# 图表
npm install recharts

# 日期处理
npm install date-fns
```

### Step 3: 创建项目结构

```bash
mkdir -p src/{features,layouts,services,constants}
```

**features/**: 按功能模块组织代码
```
features/
├── auth/              # 认证模块
│   ├── components/
│   ├── hooks/
│   ├── services/
│   └── types/
├── products/          # 商品模块
│   ├── components/
│   ├── hooks/
│   ├── services/
│   └── types/
├── orders/            # 订单模块
│   ├── components/
│   ├── hooks/
│   ├── services/
│   └── types/
└── users/             # 用户模块
    ├── components/
    ├── hooks/
    ├── services/
    └── types/
```

### Step 4: 开发组件

```tsx
// src/features/products/components/ProductTable.tsx
import { useQuery } from '@tanstack/react-query';
import { productsApi } from '../services/productsApi';

export function ProductTable() {
  const { data, isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: productsApi.getAll,
  });

  if (isLoading) return <div>Loading...</div>;

  return (
    <table className="w-full">
      {/* ... */}
    </table>
  );
}
```

### Step 5: 编写测试

```tsx
// src/features/products/components/ProductTable.test.tsx
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ProductTable } from './ProductTable';

const queryClient = new QueryClient();

describe('ProductTable', () => {
  it('renders product list', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <ProductTable />
      </QueryClientProvider>
    );

    expect(await screen.findByText('Products')).toBeInTheDocument();
  });
});
```

### Step 6: 构建部署

```bash
# 构建
npm run build

# 部署到 Vercel
bash /app/.kimi/skills/frontend-dev/scripts/deploy.sh vercel
```

---

## 场景 2: 创建一个 Vue 3 企业官网

### Step 1: 初始化项目

```bash
bash /app/.kimi/skills/frontend-dev/scripts/init-project.sh vue company-website

cd company-website
```

### Step 2: 添加动画库

```bash
npm install @vueuse/motion gsap @gsap/vue
```

### Step 3: 创建页面结构

```
src/
├── views/
│   ├── Home.vue
│   ├── About.vue
│   ├── Services.vue
│   ├── Cases.vue
│   └── Contact.vue
├── components/
│   ├── sections/
│   │   ├── HeroSection.vue
│   │   ├── FeaturesSection.vue
│   │   ├── TestimonialsSection.vue
│   │   └── CTASection.vue
│   └── ui/
│       └── ...
└── composables/
    └── useScrollAnimation.ts
```

### Step 4: 使用 Motion 动画

```vue
<!-- src/components/sections/HeroSection.vue -->
<template>
  <section ref="heroRef" class="min-h-screen flex items-center">
    <div v-motion="{
      initial: { opacity: 0, y: 100 },
      visible: { opacity: 1, y: 0, transition: { duration: 800 } }
    }">
      <h1 class="text-5xl font-bold">Welcome</h1>
    </div>
  </section>
</template>

<script setup lang="ts">
import { useMotion } from '@vueuse/motion';

const heroRef = ref();
useMotion(heroRef, {
  initial: { opacity: 0 },
  visible: { opacity: 1 }
});
</script>
```

### Step 5: E2E 测试

```typescript
// e2e/home.spec.ts
import { test, expect } from '@playwright/test';

test('homepage loads correctly', async ({ page }) => {
  await page.goto('/');
  
  await expect(page).toHaveTitle(/Company Name/);
  await expect(page.locator('h1')).toContainText('Welcome');
});

test('navigation works', async ({ page }) => {
  await page.goto('/');
  
  await page.click('text=About');
  await expect(page).toHaveURL(/\/about/);
});
```

---

## 场景 3: 团队项目协作

### 初始化团队项目

```bash
# 项目负责人创建项目
bash /app/.kimi/skills/frontend-dev/scripts/init-project.sh react team-project

cd team-project

# 初始化 Git
git init
git add .
git commit -m "chore: initial commit"

# 推送到远程仓库
git remote add origin https://github.com/team/team-project.git
git push -u origin main
```

### 团队成员工作流程

```bash
# 克隆项目
git clone https://github.com/team/team-project.git
cd team-project
npm install

# 创建功能分支
git checkout -b feat/user-profile

# 开发功能
# ... 编写代码 ...

# 提交代码（自动运行 pre-commit hook）
git add .
git commit -m "feat(profile): add user profile page"

# 推送分支
git push origin feat/user-profile

# 创建 Pull Request
# CI 会自动运行测试和构建
```

### CI/CD 流程

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run lint

  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run test:coverage

  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run test:e2e
```

---

## 场景 4: 多环境部署

### 开发环境

```bash
# .env.development
VITE_API_URL=https://api-dev.example.com
VITE_DEBUG=true
```

### 测试环境

```bash
# 构建测试版本
npm run build -- --mode staging

# 部署到测试服务器
bash /app/.kimi/skills/frontend-dev/scripts/deploy.sh static
```

### 生产环境

```bash
# .env.production
VITE_API_URL=https://api.example.com
VITE_ANALYTICS_ID=UA-XXXXX

# 构建生产版本
npm run build

# 部署到生产环境
bash /app/.kimi/skills/frontend-dev/scripts/deploy.sh vercel
```

---

## 场景 5: 自定义 SKILL

### 创建自定义初始化脚本

```bash
# scripts/init-custom-project.sh
#!/bin/bash

PROJECT_NAME=$1

# 调用基础初始化
bash /app/.kimi/skills/frontend-dev/scripts/init-project.sh react "$PROJECT_NAME"

cd "$PROJECT_NAME"

# 添加自定义依赖
npm install @company/ui-kit @company/utils

# 复制自定义模板
cp -r /path/to/custom-templates/* .

# 设置自定义配置
echo "CUSTOM_VAR=value" >> .env
```

### 创建自定义组件模板

```bash
# scripts/generate-component.sh
#!/bin/bash

COMPONENT_NAME=$1
FEATURE=$2

mkdir -p "src/features/$FEATURE/components/$COMPONENT_NAME"

cat > "src/features/$FEATURE/components/$COMPONENT_NAME/index.tsx" << EOF
import { cn } from '@/utils/cn';

interface ${COMPONENT_NAME}Props {
  className?: string;
}

export function ${COMPONENT_NAME}({ className }: ${COMPONENT_NAME}Props) {
  return (
    <div className={cn('', className)}>
      {/* Component content */}
    </div>
  );
}
EOF

cat > "src/features/$FEATURE/components/$COMPONENT_NAME/${COMPONENT_NAME}.test.tsx" << EOF
import { render, screen } from '@testing-library/react';
import { ${COMPONENT_NAME} } from './index';

describe('${COMPONENT_NAME}', () => {
  it('renders correctly', () => {
    render(<${COMPONENT_NAME} />);
    // Add assertions
  });
});
EOF
```

---

## 常见问题

### Q: 如何添加新的 ESLint 规则？

编辑 `.eslintrc.cjs`，在 `rules` 部分添加：

```javascript
rules: {
  'your-rule': 'error',
}
```

### Q: 如何修改 Prettier 配置？

编辑 `.prettierrc`：

```json
{
  "tabWidth": 4,
  "singleQuote": false
}
```

### Q: 如何跳过 Git Hooks？

```bash
git commit -m "your message" --no-verify
```

### Q: 如何更新所有依赖？

```bash
# 检查可更新依赖
npm outdated

# 更新到最新版本
npx npm-check-updates -u
npm install
```

---

## 最佳实践总结

1. **项目初始化**: 使用脚本一键创建标准化项目
2. **代码规范**: 遵循 ESLint + Prettier 自动格式化
3. **测试驱动**: 编写单元测试和 E2E 测试
4. **Git 工作流**: 使用 Conventional Commits 规范
5. **持续集成**: 利用 GitHub Actions 自动化测试
6. **环境管理**: 使用 .env 文件管理不同环境配置
7. **组件设计**: 小而专注，可复用，类型安全
