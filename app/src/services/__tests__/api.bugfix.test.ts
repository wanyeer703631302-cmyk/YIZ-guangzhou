/**
 * Bug Condition Exploration Test
 * 
 * **Validates: Requirements 2.1, 2.2, 2.3, 2.4**
 * 
 * Property 1: Fault Condition - 非JSON响应导致解析错误
 * 
 * 此测试在未修复的代码上运行，预期失败以证明bug存在。
 * 测试展示当后端返回非JSON响应时，当前代码会抛出JSON解析错误或返回通用错误信息。
 */

import { describe, it, expect, beforeEach, afterEach, vi, beforeAll } from 'vitest'
import * as fc from 'fast-check'

// Setup environment mocks before importing the module
beforeAll(() => {
  // Mock localStorage for Node environment
  const localStorageMock = (() => {
    let store: Record<string, string> = {}
    return {
      getItem: (key: string) => store[key] || null,
      setItem: (key: string, value: string) => { store[key] = value },
      removeItem: (key: string) => { delete store[key] },
      clear: () => { store = {} }
    }
  })()
  
  global.localStorage = localStorageMock as any
  
  // Mock import.meta for Vite
  ;(globalThis as any).import = {
    meta: {
      env: {
        VITE_API_URL: '/api'
      }
    }
  }
})

describe('Bug Condition Exploration: Non-JSON Response Handling', () => {
  let originalFetch: typeof global.fetch
  let apiClient: any

  beforeEach(async () => {
    originalFetch = global.fetch
    localStorage.clear()
    
    // Dynamically import to ensure mocks are applied
    const module = await import('../api')
    apiClient = module.apiClient
  })

  afterEach(() => {
    global.fetch = originalFetch
  })

  /**
   * 测试案例1: 纯文本错误响应
   * 
   * 当后端返回纯文本错误信息时（Content-Type: text/plain），
   * 当前代码会尝试调用 response.json() 导致JSON解析错误。
   * 
   * 预期反例: SyntaxError: Unexpected token 'A'...
   */
  it('Property 1.1: Plain text error response causes JSON parse error', async () => {
    const plainTextError = 'A server error occurred'
    
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      headers: new Headers({
        'content-type': 'text/plain',
      }),
      json: async () => {
        // 模拟JSON解析失败
        throw new SyntaxError(`Unexpected token 'A', "A server e"... is not valid JSON`)
      },
      text: async () => plainTextError,
    })

    const result = await apiClient.checkHealth()

    // 当前代码的行为：返回通用错误信息，丢失实际错误内容
    // 预期修复后：应该返回实际的纯文本错误内容
    expect(result.success).toBe(false)
    
    // 这个断言应该失败，因为当前代码返回的是通用错误信息
    // 而不是后端返回的实际错误内容 "A server error occurred"
    expect(result.error).toBe(plainTextError)
  })

  /**
   * 测试案例2: HTML错误页面
   * 
   * 当后端返回HTML错误页面时（Content-Type: text/html），
   * 当前代码会尝试调用 response.json() 导致JSON解析错误。
   */
  it('Property 1.2: HTML error page causes JSON parse error', async () => {
    const htmlError = '<html><body><h1>500 Internal Server Error</h1></body></html>'
    
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      headers: new Headers({
        'content-type': 'text/html',
      }),
      json: async () => {
        throw new SyntaxError(`Unexpected token '<', "<html><bo"... is not valid JSON`)
      },
      text: async () => htmlError,
    })

    const result = await apiClient.checkHealth()

    expect(result.success).toBe(false)
    
    // 这个断言应该失败，因为当前代码返回通用错误信息
    // 而不是HTML内容（或从HTML中提取的错误信息）
    expect(result.error).toContain('500 Internal Server Error')
  })

  /**
   * 测试案例3: 空响应体
   * 
   * 当后端返回空响应体时，当前代码会尝试调用 response.json()
   * 导致 "Unexpected end of JSON input" 错误。
   */
  it('Property 1.3: Empty response body causes JSON parse error', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      headers: new Headers({
        'content-type': 'text/plain',
      }),
      json: async () => {
        throw new SyntaxError('Unexpected end of JSON input')
      },
      text: async () => '',
    })

    const result = await apiClient.checkHealth()

    expect(result.success).toBe(false)
    
    // 这个断言应该失败，因为当前代码返回的是 "Unexpected end of JSON input"
    // 而不是更友好的错误信息如 "Empty response"
    expect(result.error).not.toBe('Unexpected end of JSON input')
    expect(result.error).toMatch(/empty|no content/i)
  })

  /**
   * 测试案例4: 错误Content-Type但有效JSON
   * 
   * 边缘情况：后端返回有效JSON但Content-Type错误地设置为text/plain。
   * 理想情况下，代码应该尝试解析JSON，如果失败则作为纯文本处理。
   */
  it('Property 1.4: Valid JSON with wrong Content-Type should be handled gracefully', async () => {
    const validJsonData = { error: 'Service temporarily unavailable' }
    
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
      headers: new Headers({
        'content-type': 'text/plain', // 错误的Content-Type
      }),
      json: async () => validJsonData, // 但实际是有效的JSON
      text: async () => JSON.stringify(validJsonData),
    })

    const result = await apiClient.checkHealth()

    expect(result.success).toBe(false)
    
    // 应该能够提取错误信息，无论是通过JSON解析还是文本解析
    expect(result.error).toBe('Service temporarily unavailable')
  })

  /**
   * Property-Based Test: 任意非JSON响应都应该被优雅处理
   * 
   * 使用fast-check生成各种非JSON响应，验证当前代码的行为。
   * 这个测试应该在未修复的代码上失败，展示各种反例。
   */
  it('Property 1.5: Any non-JSON response should be handled gracefully (PBT)', async () => {
    await fc.assert(
      fc.asyncProperty(
        // 生成各种非JSON文本内容
        fc.oneof(
          fc.constant('A server error occurred'),
          fc.constant('<html><body>Error</body></html>'),
          fc.constant(''),
          fc.string({ minLength: 1, maxLength: 100 }),
          fc.constant('500 Internal Server Error'),
          fc.constant('Service Unavailable')
        ),
        // 生成各种非JSON Content-Type
        fc.oneof(
          fc.constant('text/plain'),
          fc.constant('text/html'),
          fc.constant('text/xml'),
          fc.constant('application/xml')
        ),
        async (responseText, contentType) => {
          global.fetch = vi.fn().mockResolvedValue({
            ok: false,
            status: 500,
            headers: new Headers({
              'content-type': contentType,
            }),
            json: async () => {
              // 模拟JSON解析失败
              throw new SyntaxError(`Unexpected token in JSON`)
            },
            text: async () => responseText,
          })

          const result = await apiClient.checkHealth()

          // 断言：修复后应该返回实际的响应文本，而不是通用错误
          expect(result.success).toBe(false)
          
          // 当前代码会失败这个断言，因为它返回通用错误信息
          // 修复后应该返回实际的响应内容
          if (responseText.trim()) {
            expect(result.error).toBe(responseText)
          } else {
            // 空响应应该返回有意义的错误信息
            expect(result.error).toMatch(/empty|no content/i)
          }
        }
      ),
      { numRuns: 20 } // 运行20次以发现各种反例
    )
  })
})
