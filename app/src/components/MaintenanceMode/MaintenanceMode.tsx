/**
 * Maintenance Mode Component
 * 
 * Displays a maintenance mode message when backend is unavailable
 * Provides retry functionality
 * 
 * Validates Requirements: 12.8
 */

import { motion } from 'framer-motion'
import type { HealthData } from '../../types/api'

interface MaintenanceModeProps {
  error: string | null
  healthData: HealthData | null
  onRetry: () => void
}

export function MaintenanceMode({ error, healthData, onRetry }: MaintenanceModeProps) {
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      {/* Background effects */}
      <div className="fixed inset-0 grid-lines pointer-events-none z-0" />
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-[150px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-[150px]" />
      </div>

      {/* Logo */}
      <header className="fixed top-0 left-0 z-50 px-6 py-4">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
        >
          <img src="/YIZ_LOGO.svg" alt="YIZ" className="h-9 w-auto" />
        </motion.div>
      </header>

      {/* Maintenance message */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 text-center max-w-2xl px-6"
      >
        {/* Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-8xl mb-8"
        >
          🔧
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-4xl md:text-5xl font-bold mb-4"
        >
          系统维护中
        </motion.h1>

        {/* Description */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-xl text-white/60 mb-8"
        >
          后端服务暂时不可用，我们正在努力恢复服务
        </motion.p>

        {/* Error details */}
        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="mb-8 p-4 bg-white/5 border border-white/10 rounded-lg"
          >
            <p className="text-sm text-white/80 mb-2">错误详情：</p>
            <p className="text-sm text-red-400 font-mono">{error}</p>
          </motion.div>
        )}

        {/* Service status */}
        {healthData && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="mb-8 p-4 bg-white/5 border border-white/10 rounded-lg"
          >
            <p className="text-sm text-white/80 mb-3">服务状态：</p>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-white/60">数据库：</span>
                <span
                  className={
                    healthData.services.database === 'connected'
                      ? 'text-green-400'
                      : 'text-red-400'
                  }
                >
                  {healthData.services.database === 'connected' ? '✓ 已连接' : '✗ 未连接'}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-white/60">图片存储：</span>
                <span
                  className={
                    healthData.services.cloudinary === 'configured'
                      ? 'text-green-400'
                      : 'text-red-400'
                  }
                >
                  {healthData.services.cloudinary === 'configured'
                    ? '✓ 已配置'
                    : '✗ 未配置'}
                </span>
              </div>
            </div>
          </motion.div>
        )}

        {/* Retry button */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.7 }}
          onClick={onRetry}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="px-8 py-4 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors font-medium"
        >
          重试连接
        </motion.button>

        {/* Additional info */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="mt-8 text-sm text-white/40"
        >
          如果问题持续存在，请联系技术支持
        </motion.p>
      </motion.div>
    </div>
  )
}
