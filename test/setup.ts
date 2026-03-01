import { beforeAll, afterAll, afterEach } from 'vitest'

// Setup test environment
beforeAll(() => {
  // Set test environment variables
  process.env.NODE_ENV = 'test'
  process.env.JWT_SECRET = 'test-secret-key'
  process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'
})

// Cleanup after each test
afterEach(() => {
  // Clear any mocks or test data
})

// Cleanup after all tests
afterAll(() => {
  // Close any open connections
})
