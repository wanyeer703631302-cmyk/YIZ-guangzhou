#!/bin/bash

# Frontend Project Initialization Script
# Usage: bash init-project.sh <framework> <project-name>
# Frameworks: react, vue, next, nuxt

set -e

FRAMEWORK=$1
PROJECT_NAME=$2
SKILL_DIR="/app/.kimi/skills/frontend-dev"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
print_info() {
  echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
  echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
  echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
  echo -e "${RED}[ERROR]${NC} $1"
}

# Validate inputs
if [ -z "$FRAMEWORK" ] || [ -z "$PROJECT_NAME" ]; then
  print_error "Usage: bash init-project.sh <framework> <project-name>"
  print_info "Frameworks: react, vue, next, nuxt"
  exit 1
fi

if [[ ! "$FRAMEWORK" =~ ^(react|vue|next|nuxt)$ ]]; then
  print_error "Invalid framework: $FRAMEWORK"
  print_info "Supported frameworks: react, vue, next, nuxt"
  exit 1
fi

# Check if directory exists
if [ -d "$PROJECT_NAME" ]; then
  print_error "Directory '$PROJECT_NAME' already exists"
  exit 1
fi

print_info "Creating $FRAMEWORK project: $PROJECT_NAME"

# Create project based on framework
case $FRAMEWORK in
  react)
    init_react
    ;;
  vue)
    init_vue
    ;;
  next)
    init_next
    ;;
  nuxt)
    init_nuxt
    ;;
esac

print_success "Project '$PROJECT_NAME' created successfully!"
print_info "Next steps:"
echo "  cd $PROJECT_NAME"
echo "  npm run dev"

# Function to initialize React project
init_react() {
  print_info "Initializing React + TypeScript + Vite project..."
  
  # Create Vite project
  npm create vite@latest "$PROJECT_NAME" -- --template react-ts -y
  
  cd "$PROJECT_NAME"
  
  # Install base dependencies
  print_info "Installing dependencies..."
  npm install
  
  # Install additional dependencies
  npm install \
    react-router-dom \
    zustand \
    clsx \
    tailwind-merge \
    @radix-ui/react-slot \
    class-variance-authority \
    lucide-react
  
  # Install dev dependencies
  npm install -D \
    @types/node \
    @typescript-eslint/eslint-plugin \
    @typescript-eslint/parser \
    eslint \
    eslint-plugin-react \
    eslint-plugin-react-hooks \
    eslint-plugin-jsx-a11y \
    eslint-plugin-import \
    eslint-config-prettier \
    prettier \
    prettier-plugin-tailwindcss \
    husky \
    lint-staged \
    vitest \
    @testing-library/react \
    @testing-library/jest-dom \
    @testing-library/user-event \
    jsdom \
    @playwright/test \
    autoprefixer \
    postcss
  
  # Setup project structure
  setup_react_structure
  
  # Copy config files
  copy_config_files "react"
  
  # Setup Tailwind
  npx tailwindcss init -p
  
  # Setup Husky
  npx husky init
  
  print_success "React project initialized"
}

# Function to initialize Vue project
init_vue() {
  print_info "Initializing Vue 3 + TypeScript + Vite project..."
  
  # Create Vite project
  npm create vite@latest "$PROJECT_NAME" -- --template vue-ts -y
  
  cd "$PROJECT_NAME"
  
  # Install base dependencies
  print_info "Installing dependencies..."
  npm install
  
  # Install additional dependencies
  npm install \
    vue-router@4 \
    pinia \
    @vueuse/core \
    clsx \
    tailwind-merge
  
  # Install dev dependencies
  npm install -D \
    @types/node \
    @typescript-eslint/eslint-plugin \
    @typescript-eslint/parser \
    eslint \
    eslint-plugin-vue \
    eslint-config-prettier \
    prettier \
    prettier-plugin-tailwindcss \
    husky \
    lint-staged \
    vitest \
    @vue/test-utils \
    jsdom \
    @playwright/test \
    autoprefixer \
    postcss
  
  # Setup project structure
  setup_vue_structure
  
  # Copy config files
  copy_config_files "vue"
  
  # Setup Tailwind
  npx tailwindcss init -p
  
  # Setup Husky
  npx husky init
  
  print_success "Vue project initialized"
}

# Function to initialize Next.js project
init_next() {
  print_info "Initializing Next.js project..."
  
  # Create Next.js project
  npx create-next-app@latest "$PROJECT_NAME" \
    --typescript \
    --tailwind \
    --eslint \
    --app \
    --src-dir \
    --import-alias "@/*" \
    --use-npm \
    --yes
  
  cd "$PROJECT_NAME"
  
  # Install additional dependencies
  print_info "Installing additional dependencies..."
  npm install \
    zustand \
    @radix-ui/react-slot \
    class-variance-authority \
    clsx \
    tailwind-merge \
    lucide-react
  
  # Install dev dependencies
  npm install -D \
    @types/node \
    prettier \
    prettier-plugin-tailwindcss \
    husky \
    lint-staged \
    vitest \
    @testing-library/react \
    @testing-library/jest-dom \
    jsdom \
    @playwright/test
  
  # Setup Husky
  npx husky init
  
  print_success "Next.js project initialized"
}

# Function to initialize Nuxt project
init_nuxt() {
  print_info "Initializing Nuxt 3 project..."
  
  # Create Nuxt project
  npx nuxi@latest init "$PROJECT_NAME"
  
  cd "$PROJECT_NAME"
  
  # Install dependencies
  print_info "Installing dependencies..."
  npm install
  
  # Install additional dependencies
  npm install \
    @pinia/nuxt \
    pinia \
    @vueuse/nuxt \
    @nuxtjs/tailwindcss
  
  # Install dev dependencies
  npm install -D \
    @nuxt/test-utils \
    vitest \
    @vue/test-utils \
    happy-dom \
    @playwright/test \
    prettier \
    eslint \
    @nuxtjs/eslint-config-typescript
  
  print_success "Nuxt 3 project initialized"
}

# Setup React project structure
setup_react_structure() {
  print_info "Setting up React project structure..."
  
  mkdir -p src/{components/{ui,common},hooks,stores,utils,types,styles,__tests__}
  mkdir -p e2e
  mkdir -p .vscode
  mkdir -p docs
  
  # Create sample files
  cat > src/components/ui/Button.tsx << 'EOF'
import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/utils/cn';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-md px-8',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
EOF

  cat > src/utils/cn.ts << 'EOF'
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
EOF

  cat > src/hooks/useCounter.ts << 'EOF'
import { useState, useCallback } from 'react';

export function useCounter(initialValue = 0) {
  const [count, setCount] = useState(initialValue);

  const increment = useCallback(() => setCount((c) => c + 1), []);
  const decrement = useCallback(() => setCount((c) => c - 1), []);
  const reset = useCallback(() => setCount(initialValue), [initialValue]);

  return { count, increment, decrement, reset };
}
EOF

  cat > src/__tests__/Button.test.tsx << 'EOF'
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '@/components/ui/Button';

describe('Button', () => {
  it('renders correctly', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('handles click events', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    fireEvent.click(screen.getByText('Click me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
EOF
}

# Setup Vue project structure
setup_vue_structure() {
  print_info "Setting up Vue project structure..."
  
  mkdir -p src/{components/{ui,common},composables,stores,utils,types,styles,__tests__}
  mkdir -p e2e
  mkdir -p .vscode
  mkdir -p docs
  
  # Create sample files
  cat > src/components/ui/BaseButton.vue << 'EOF'
<template>
  <button
    :class="buttonClasses"
    :disabled="disabled"
    @click="$emit('click', $event)"
  >
    <slot />
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { cn } from '@/utils/cn';

interface Props {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  disabled?: boolean;
  class?: string;
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'default',
  size: 'default',
  disabled: false,
});

defineEmits<{
  click: [event: MouseEvent];
}>();

const buttonClasses = computed(() => {
  return cn(
    'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
    'disabled:pointer-events-none disabled:opacity-50',
    {
      'bg-primary text-primary-foreground hover:bg-primary/90': props.variant === 'default',
      'bg-destructive text-destructive-foreground hover:bg-destructive/90': props.variant === 'destructive',
      'border border-input bg-background hover:bg-accent hover:text-accent-foreground': props.variant === 'outline',
      'bg-secondary text-secondary-foreground hover:bg-secondary/80': props.variant === 'secondary',
      'hover:bg-accent hover:text-accent-foreground': props.variant === 'ghost',
      'text-primary underline-offset-4 hover:underline': props.variant === 'link',
      'h-10 px-4 py-2': props.size === 'default',
      'h-9 rounded-md px-3': props.size === 'sm',
      'h-11 rounded-md px-8': props.size === 'lg',
      'h-10 w-10': props.size === 'icon',
    },
    props.class
  );
});
</script>
EOF

  cat > src/utils/cn.ts << 'EOF'
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
EOF

  cat > src/composables/useCounter.ts << 'EOF'
import { ref, computed } from 'vue';

export function useCounter(initialValue = 0) {
  const count = ref(initialValue);

  const increment = () => count.value++;
  const decrement = () => count.value--;
  const reset = () => count.value = initialValue;

  const double = computed(() => count.value * 2);

  return {
    count,
    double,
    increment,
    decrement,
    reset,
  };
}
EOF
}

# Copy configuration files
copy_config_files() {
  local framework=$1
  print_info "Copying configuration files..."
  
  # Copy ESLint config
  cp "$SKILL_DIR/templates/.eslintrc.$framework.cjs" .eslintrc.cjs
  
  # Copy Prettier config
  cp "$SKILL_DIR/templates/.prettierrc" .prettierrc
  
  # Copy Tailwind config
  cp "$SKILL_DIR/templates/tailwind.config.js" tailwind.config.js
  
  # Copy TypeScript config
  cp "$SKILL_DIR/templates/tsconfig.json" tsconfig.json
  
  # Copy VS Code settings
  mkdir -p .vscode
  cp "$SKILL_DIR/templates/vscode-settings.json" .vscode/settings.json
  cp "$SKILL_DIR/templates/vscode-extensions.json" .vscode/extensions.json
  
  # Copy GitHub Actions workflow
  mkdir -p .github/workflows
  cp "$SKILL_DIR/templates/ci.yml" .github/workflows/ci.yml
  
  # Copy Husky hooks
  cp "$SKILL_DIR/templates/pre-commit" .husky/pre-commit
  chmod +x .husky/pre-commit
  
  # Copy test setup
  cp "$SKILL_DIR/templates/vitest.config.ts" vitest.config.ts
  cp "$SKILL_DIR/templates/vitest.setup.ts" vitest.setup.ts
  
  # Copy Playwright config
  cp "$SKILL_DIR/templates/playwright.config.ts" playwright.config.ts
  
  # Copy .gitignore additions
  cat "$SKILL_DIR/templates/gitignore-additions" >> .gitignore
  
  # Copy README template
  cp "$SKILL_DIR/templates/README.md" README.md
  
  # Update package.json scripts
  node "$SKILL_DIR/scripts/update-package-json.js" "$framework"
}

print_info "Script completed"
