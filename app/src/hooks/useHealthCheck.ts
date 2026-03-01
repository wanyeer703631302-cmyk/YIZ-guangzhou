/**
 * Health Check Hook
 * 
 * Checks backend health status on app startup
 * Shows maintenance mode when backend is unavailable
 * 
 * Validates Requirements: 12.7, 12.8
 */

import { useState, useEffect } from 'react'
import { apiClient } from '../services/api'
import type { HealthData } from '../types/api'

interface HealthCheckState {
  isChecking: boolean
  isHealthy: boolean
  error: string | null
  data: HealthData | null
  retry: () => void
}

/**
 * Hook to check backend health status
 * 
 * Automatically checks health on mount and provides retry functionality
 */
export function useHealthCheck(): HealthCheckState {
  const [isChecking, setIsChecking] = useState(true)
  const [isHealthy, setIsHealthy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<HealthData | null>(null)
  const [retryCount, setRetryCount] = useState(0)

  const checkHealth = async () => {
    setIsChecking(true)
    setError(null)

    try {
      const response = await apiClient.checkHealth()

      if (response.success && response.data) {
        setData(response.data)
        setIsHealthy(response.data.status === 'ok')
        
        if (response.data.status !== 'ok') {
          setError(response.data.message || '后端服务不可用')
        }
      } else {
        setIsHealthy(false)
        setError(response.error || '无法连接到后端服务')
      }
    } catch (err) {
      setIsHealthy(false)
      setError(err instanceof Error ? err.message : '健康检查失败')
    } finally {
      setIsChecking(false)
    }
  }

  const retry = () => {
    setRetryCount(prev => prev + 1)
  }

  useEffect(() => {
    checkHealth()
  }, [retryCount])

  return {
    isChecking,
    isHealthy,
    error,
    data,
    retry,
  }
}
