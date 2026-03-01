import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  isCloudinaryConfigured,
  generateThumbnailUrl,
  optimizeCloudinaryUrl,
} from '../cloudinary'

describe('Cloudinary Configuration', () => {
  const originalEnv = process.env

  beforeEach(() => {
    vi.resetModules()
    process.env = { ...originalEnv }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  describe('isCloudinaryConfigured', () => {
    it('should return true when all environment variables are set', () => {
      process.env.CLOUDINARY_CLOUD_NAME = 'test-cloud'
      process.env.CLOUDINARY_API_KEY = 'test-key'
      process.env.CLOUDINARY_API_SECRET = 'test-secret'

      expect(isCloudinaryConfigured()).toBe(true)
    })

    it('should return false when CLOUDINARY_CLOUD_NAME is missing', () => {
      delete process.env.CLOUDINARY_CLOUD_NAME
      process.env.CLOUDINARY_API_KEY = 'test-key'
      process.env.CLOUDINARY_API_SECRET = 'test-secret'

      expect(isCloudinaryConfigured()).toBe(false)
    })

    it('should return false when CLOUDINARY_API_KEY is missing', () => {
      process.env.CLOUDINARY_CLOUD_NAME = 'test-cloud'
      delete process.env.CLOUDINARY_API_KEY
      process.env.CLOUDINARY_API_SECRET = 'test-secret'

      expect(isCloudinaryConfigured()).toBe(false)
    })

    it('should return false when CLOUDINARY_API_SECRET is missing', () => {
      process.env.CLOUDINARY_CLOUD_NAME = 'test-cloud'
      process.env.CLOUDINARY_API_KEY = 'test-key'
      delete process.env.CLOUDINARY_API_SECRET

      expect(isCloudinaryConfigured()).toBe(false)
    })

    it('should return false when all environment variables are missing', () => {
      delete process.env.CLOUDINARY_CLOUD_NAME
      delete process.env.CLOUDINARY_API_KEY
      delete process.env.CLOUDINARY_API_SECRET

      expect(isCloudinaryConfigured()).toBe(false)
    })
  })

  describe('generateThumbnailUrl', () => {
    it('should generate thumbnail URL with default width', () => {
      const originalUrl = 'https://res.cloudinary.com/demo/upload/sample.jpg'
      const result = generateThumbnailUrl(originalUrl)

      expect(result).toBe(
        'https://res.cloudinary.com/demo/upload/f_auto,q_auto,c_thumb,w_400/sample.jpg'
      )
    })

    it('should generate thumbnail URL with custom width', () => {
      const originalUrl = 'https://res.cloudinary.com/demo/upload/sample.jpg'
      const result = generateThumbnailUrl(originalUrl, 800)

      expect(result).toBe(
        'https://res.cloudinary.com/demo/upload/f_auto,q_auto,c_thumb,w_800/sample.jpg'
      )
    })

    it('should return original URL if already optimized', () => {
      const optimizedUrl =
        'https://res.cloudinary.com/demo/upload/f_auto,q_auto,c_thumb,w_400/sample.jpg'
      const result = generateThumbnailUrl(optimizedUrl)

      expect(result).toBe(optimizedUrl)
    })

    it('should return original URL if not a Cloudinary URL', () => {
      const nonCloudinaryUrl = 'https://example.com/image.jpg'
      const result = generateThumbnailUrl(nonCloudinaryUrl)

      expect(result).toBe(nonCloudinaryUrl)
    })

    it('should handle empty URL', () => {
      const result = generateThumbnailUrl('')

      expect(result).toBe('')
    })
  })

  describe('optimizeCloudinaryUrl', () => {
    it('should optimize Cloudinary URL', () => {
      const originalUrl = 'https://res.cloudinary.com/demo/upload/sample.jpg'
      const result = optimizeCloudinaryUrl(originalUrl)

      expect(result).toBe(
        'https://res.cloudinary.com/demo/upload/f_auto,q_auto/sample.jpg'
      )
    })

    it('should return original URL if already optimized', () => {
      const optimizedUrl =
        'https://res.cloudinary.com/demo/upload/f_auto,q_auto/sample.jpg'
      const result = optimizeCloudinaryUrl(optimizedUrl)

      expect(result).toBe(optimizedUrl)
    })

    it('should return original URL if not a Cloudinary URL', () => {
      const nonCloudinaryUrl = 'https://example.com/image.jpg'
      const result = optimizeCloudinaryUrl(nonCloudinaryUrl)

      expect(result).toBe(nonCloudinaryUrl)
    })

    it('should handle empty URL', () => {
      const result = optimizeCloudinaryUrl('')

      expect(result).toBe('')
    })
  })
})
