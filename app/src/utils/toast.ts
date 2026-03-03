import { toast as sonnerToast } from 'sonner'

/**
 * Toast notification utilities with retry logic
 */

export const toast = {
  success: (message: string) => {
    sonnerToast.success(message, { duration: 3000 })
  },

  error: (message: string, options?: { retry?: () => void }) => {
    if (options?.retry) {
      sonnerToast.error(message, {
        duration: 5000,
        action: {
          label: '重试',
          onClick: options.retry
        }
      })
    } else {
      sonnerToast.error(message, { duration: 3000 })
    }
  },

  loading: (message: string) => {
    return sonnerToast.loading(message)
  },

  dismiss: (toastId: string | number) => {
    sonnerToast.dismiss(toastId)
  }
}

/**
 * Retry logic with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 2,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error | null = null

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error')
      
      if (attempt < maxRetries) {
        // Exponential backoff: 1s, 2s, 4s, etc.
        const delay = baseDelay * Math.pow(2, attempt)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }

  throw lastError
}
