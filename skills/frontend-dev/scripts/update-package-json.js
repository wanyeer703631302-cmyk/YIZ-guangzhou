#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const framework = process.argv[2];

if (!framework) {
  console.error('Usage: node update-package-json.js <framework>');
  process.exit(1);
}

const packageJsonPath = path.join(process.cwd(), 'package.json');

if (!fs.existsSync(packageJsonPath)) {
  console.error('package.json not found');
  process.exit(1);
}

const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

// Common scripts for all frameworks
const commonScripts = {
  lint: 'eslint . --ext .ts,.tsx,.vue --report-unused-disable-directives --max-warnings 0',
  'lint:fix': 'eslint . --ext .ts,.tsx,.vue --fix',
  format: 'prettier --write "src/**/*.{ts,tsx,vue,css,md}"',
  'format:check': 'prettier --check "src/**/*.{ts,tsx,vue,css,md}"',
  test: 'vitest run',
  'test:watch': 'vitest',
  'test:coverage': 'vitest run --coverage',
  'test:e2e': 'playwright test',
  'test:e2e:headed': 'playwright test --headed',
  'test:e2e:report': 'playwright show-report',
  'type-check': 'tsc --noEmit',
  prepare: 'husky',
};

// Framework-specific scripts
const frameworkScripts = {
  react: {
    ...commonScripts,
    analyze: 'npx vite-bundle-analyzer dist',
  },
  vue: {
    ...commonScripts,
    analyze: 'npx vite-bundle-analyzer dist',
  },
  next: {
    ...commonScripts,
    analyze: 'npx @next/bundle-analyzer',
  },
  nuxt: {
    ...commonScripts,
    analyze: 'npx nuxt analyze',
  },
};

// lint-staged configuration
const lintStagedConfig = {
  '*.{ts,tsx,vue}': ['eslint --fix', 'prettier --write'],
  '*.{css,scss,md,json}': ['prettier --write'],
};

// Update package.json
packageJson.scripts = {
  ...packageJson.scripts,
  ...frameworkScripts[framework],
};

packageJson['lint-staged'] = lintStagedConfig;

// Add engines field
packageJson.engines = {
  node: '>=18.0.0',
  npm: '>=9.0.0',
};

// Write updated package.json
fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));

console.log('✅ package.json updated successfully');
