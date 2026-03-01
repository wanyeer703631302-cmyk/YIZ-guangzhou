import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
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
    ],
  },
})
