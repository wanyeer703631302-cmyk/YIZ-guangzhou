import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './app/src'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'test/',
        'dist/',
        'app/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockData',
      ],
      include: [
        'api/**/*.ts',
        'lib/**/*.ts',
      ],
    },
    include: [
      'api/**/*.test.ts',
      'lib/**/*.test.ts',
      'api/**/*.property.test.ts',
      'lib/**/*.property.test.ts',
      'app/src/**/*.test.ts',
      'app/src/**/*.test.tsx',
      'app/src/**/*.property.test.ts',
      'app/src/**/*.property.test.tsx',
    ],
  },
})
