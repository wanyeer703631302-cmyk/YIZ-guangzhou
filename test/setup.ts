import { beforeAll, afterAll, afterEach } from 'vitest'
import '@testing-library/jest-dom'

// Mock localStorage for browser APIs
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value },
    removeItem: (key: string) => { delete store[key] },
    clear: () => { store = {} }
  }
})()

// Mock import.meta for Vite
;(globalThis as any).import = {
  meta: {
    env: {
      VITE_API_URL: '/api'
    }
  }
}

// Setup test environment
beforeAll(() => {
  // Set test environment variables
  process.env.NODE_ENV = 'test'
  process.env.JWT_SECRET = 'test-secret-key'
  process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'
  
  // Setup browser API mocks
  global.localStorage = localStorageMock as any
})

// Cleanup after each test
afterEach(() => {
  // Clear any mocks or test data
  localStorageMock.clear()
})

// Cleanup after all tests
afterAll(() => {
  // Close any open connections
})
