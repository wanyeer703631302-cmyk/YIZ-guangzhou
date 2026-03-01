import { useState } from 'react'
import { apiClient } from '../../services/api'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Spinner } from '../ui/spinner'

interface LoginFormProps {
  onSuccess?: () => void
  onSwitchToRegister?: () => void
}

export function LoginForm({ onSuccess, onSwitchToRegister }: LoginFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 表单验证
  const validateForm = (): boolean => {
    if (!email.trim()) {
      setError('请输入邮箱地址')
      return false
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('请输入有效的邮箱地址')
      return false
    }

    if (!password) {
      setError('请输入密码')
      return false
    }

    if (password.length < 6) {
      setError('密码至少需要6个字符')
      return false
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // 验证表单
    if (!validateForm()) {
      return
    }

    setLoading(true)

    try {
      const response = await apiClient.login(email, password)

      if (response.success) {
        // 登录成功
        onSuccess?.()
      } else {
        // 显示错误消息
        setError(response.error || '登录失败，请重试')
      }
    } catch (err) {
      setError('网络错误，请检查您的连接')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md mx-auto p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-center mb-2">登录</h2>
        <p className="text-sm text-gray-600 text-center">
          欢迎回来，请登录您的账户
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* 邮箱输入 */}
        <div className="space-y-2">
          <Label htmlFor="email">邮箱</Label>
          <Input
            id="email"
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            autoComplete="email"
          />
        </div>

        {/* 密码输入 */}
        <div className="space-y-2">
          <Label htmlFor="password">密码</Label>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            autoComplete="current-password"
          />
        </div>

        {/* 错误消息 */}
        {error && (
          <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
            {error}
          </div>
        )}

        {/* 提交按钮 */}
        <Button
          type="submit"
          className="w-full"
          disabled={loading}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <Spinner className="w-4 h-4" />
              登录中...
            </span>
          ) : (
            '登录'
          )}
        </Button>
      </form>

      {/* 切换到注册 */}
      {onSwitchToRegister && (
        <div className="mt-4 text-center text-sm">
          <span className="text-gray-600">还没有账户？</span>{' '}
          <button
            type="button"
            onClick={onSwitchToRegister}
            className="text-blue-600 hover:text-blue-700 font-medium"
            disabled={loading}
          >
            立即注册
          </button>
        </div>
      )}
    </div>
  )
}
