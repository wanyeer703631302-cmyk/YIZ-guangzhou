# {{PROJECT_NAME}}

{{PROJECT_DESCRIPTION}}

## Tech Stack

- **Framework**: {{FRAMEWORK}} + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **State Management**: {{STATE_MANAGEMENT}}
- **Testing**: Vitest + React Testing Library + Playwright
- **Linting**: ESLint + Prettier

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd {{PROJECT_NAME}}

# Install dependencies
npm install

# Start development server
npm run dev
```

### Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |
| `npm run lint:fix` | Fix ESLint errors |
| `npm run format` | Format code with Prettier |
| `npm run test` | Run unit tests |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Run tests with coverage |
| `npm run test:e2e` | Run E2E tests |

## Project Structure

```
{{PROJECT_NAME}}/
├── public/              # Static assets
├── src/
│   ├── assets/         # Images, fonts, styles
│   ├── components/     # Reusable components
│   │   ├── ui/        # UI primitives
│   │   └── common/    # Business components
│   ├── hooks/          # Custom hooks
│   ├── stores/         # State management
│   ├── utils/          # Utility functions
│   ├── types/          # TypeScript types
│   ├── styles/         # Global styles
│   └── __tests__/      # Unit tests
├── e2e/                # E2E tests
├── .vscode/            # VS Code settings
├── docs/               # Documentation
└── ...config files
```

## Development Guidelines

### Code Style

- Follow ESLint and Prettier configurations
- Use TypeScript for type safety
- Write tests for new features
- Follow conventional commits

### Component Guidelines

- Keep components small and focused
- Use composition over inheritance
- Extract reusable logic into hooks
- Document complex components

### Testing

- Write unit tests for utilities and hooks
- Write component tests for UI components
- Write E2E tests for critical user flows
- Aim for >80% code coverage

## Deployment

### Build

```bash
npm run build
```

The build output will be in the `dist/` directory.

### Environment Variables

Create `.env.local` for local development:

```
VITE_API_URL=http://localhost:3000
```

Create `.env.production` for production:

```
VITE_API_URL=https://api.example.com
```

## Contributing

1. Create a feature branch: `git checkout -b feature/my-feature`
2. Make your changes
3. Run tests: `npm run test`
4. Commit with conventional commits: `git commit -m "feat: add new feature"`
5. Push and create a pull request

## License

[MIT](LICENSE)
