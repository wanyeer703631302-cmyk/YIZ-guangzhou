---
name: frontend-dev
description: Modern frontend development skill with standardized workflow for React/Vue projects. Includes project initialization, code standards, build & deploy, and testing.
version: 1.0.0
---

# Frontend Development Skill

A comprehensive frontend development workflow covering project initialization, code standards, build & deployment, and testing.

## Supported Frameworks

- **React** + TypeScript + Vite
- **Vue 3** + TypeScript + Vite
- **Next.js** (Full-stack React)
- **Nuxt 3** (Full-stack Vue)

## Quick Start

### 1. Initialize Project

```bash
# React + TypeScript + Vite
bash /app/.kimi/skills/frontend-dev/scripts/init-project.sh react my-app

# Vue 3 + TypeScript + Vite
bash /app/.kimi/skills/frontend-dev/scripts/init-project.sh vue my-app

# Next.js
bash /app/.kimi/skills/frontend-dev/scripts/init-project.sh next my-app

# Nuxt 3
bash /app/.kimi/skills/frontend-dev/scripts/init-project.sh nuxt my-app
```

### 2. Development Workflow

```bash
cd my-app

# Start development server
npm run dev

# Run linting
npm run lint

# Run tests
npm run test

# Build for production
npm run build

# Preview production build
npm run preview
```

### 3. Deploy

```bash
# Deploy to static hosting
bash /app/.kimi/skills/frontend-dev/scripts/deploy.sh
```

---

## Project Structure

```
my-app/
├── public/                 # Static assets
├── src/
│   ├── assets/            # Images, fonts, styles
│   ├── components/        # Reusable components
│   │   ├── ui/           # UI primitives (Button, Input, etc.)
│   │   └── common/       # Business components
│   ├── hooks/            # Custom React/Vue hooks
│   ├── stores/           # State management
│   ├── utils/            # Utility functions
│   ├── types/            # TypeScript types
│   ├── styles/           # Global styles
│   └── __tests__/        # Unit tests
├── e2e/                   # E2E tests
├── .vscode/              # VS Code settings
├── .husky/               # Git hooks
├── scripts/              # Build/deploy scripts
├── docs/                 # Documentation
├── dist/                 # Build output (gitignored)
├── index.html
├── vite.config.ts
├── tsconfig.json
├── package.json
└── README.md
```

---

## Code Standards

### ESLint Configuration

All projects include pre-configured ESLint with:

- **React**: `eslint-plugin-react`, `eslint-plugin-react-hooks`, `eslint-plugin-jsx-a11y`
- **Vue**: `eslint-plugin-vue`, `vue-eslint-parser`
- **TypeScript**: `@typescript-eslint/eslint-plugin`
- **Import sorting**: `eslint-plugin-import`
- **Prettier integration**: `eslint-config-prettier`

### Prettier Configuration

```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100,
  "bracketSpacing": true,
  "arrowParens": "avoid"
}
```

### Git Hooks (Husky)

- **pre-commit**: Run linting and formatting on staged files
- **commit-msg**: Validate commit message format (Conventional Commits)
- **pre-push**: Run tests before pushing

### Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

Example: `feat(auth): add login form validation`

---

## Testing Strategy

### Unit Testing (Vitest)

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### E2E Testing (Playwright)

```bash
# Run E2E tests
npm run test:e2e

# Run E2E tests in headed mode
npm run test:e2e:headed

# Generate E2E test report
npm run test:e2e:report
```

### Component Testing

- **React**: `@testing-library/react` + Vitest
- **Vue**: `@vue/test-utils` + Vitest

---

## Build & Deploy

### Build Configuration

- **Vite**: Optimized for production with tree-shaking, code splitting
- **Environment variables**: `.env`, `.env.local`, `.env.production`
- **Output**: `dist/` directory

### Deployment Targets

| Target | Command | Description |
|--------|---------|-------------|
| Static | `npm run deploy:static` | Deploy to CDN/static hosting |
| Vercel | `npm run deploy:vercel` | Deploy to Vercel |
| Netlify | `npm run deploy:netlify` | Deploy to Netlify |
| Docker | `npm run deploy:docker` | Build Docker image |

---

## Environment Variables

```bash
# .env (shared)
VITE_APP_NAME=MyApp
VITE_API_BASE_URL=/api

# .env.local (local only, gitignored)
VITE_API_MOCK=true

# .env.production (production only)
VITE_API_BASE_URL=https://api.example.com
```

---

## Common Tasks

### Add a New Component

```bash
# React
npx generate-react-cli component Button

# Vue
npx hygen component new Button
```

### Add a New Page/Route

```bash
# React (React Router)
npx hygen page new Dashboard

# Vue (Vue Router)
npx hygen page new Dashboard
```

### Update Dependencies

```bash
# Check outdated packages
npm outdated

# Update all dependencies
npm update

# Update to latest major versions
npx npm-check-updates -u && npm install
```

---

## Troubleshooting

### Build Failures

1. Check TypeScript errors: `npx tsc --noEmit`
2. Check ESLint errors: `npm run lint`
3. Clear cache: `rm -rf node_modules dist && npm install`

### Test Failures

1. Run single test file: `npm run test -- src/components/Button.test.tsx`
2. Update snapshots: `npm run test -- -u`
3. Debug mode: `npm run test -- --reporter=verbose`

### Performance Issues

1. Analyze bundle: `npm run analyze`
2. Check for duplicate dependencies: `npx depcheck`
3. Enable production profiling

---

## Best Practices

### Component Design

- Keep components small and focused (< 200 lines)
- Use composition over inheritance
- Extract reusable logic into custom hooks
- Use TypeScript for all props and state

### State Management

- Start with local state (`useState`, `ref`)
- Use Context for global state (themes, auth)
- Consider Pinia/Zustand for complex state
- Avoid prop drilling (> 3 levels)

### Performance

- Use `React.memo` / `defineComponent` for pure components
- Lazy load routes and heavy components
- Optimize images (WebP, lazy loading)
- Use virtual scrolling for long lists

### Accessibility

- Use semantic HTML elements
- Include `aria-*` attributes
- Ensure keyboard navigation
- Test with screen readers

---

## Resources

- [Vite Documentation](https://vitejs.dev/)
- [React Documentation](https://react.dev/)
- [Vue Documentation](https://vuejs.org/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)
