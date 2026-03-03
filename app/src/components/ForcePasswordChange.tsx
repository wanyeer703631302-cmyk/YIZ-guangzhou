import { useState } from 'react'
import { changePassword } from '../services/adminApi'

interface ForcePasswordChangeProps {
  onSuccess: (newToken: string) => void
}

export function ForcePasswordChange({ onSuccess }: ForcePasswordChangeProps) {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [validationErrors, setValidationErrors] = useState<string[]>([])

  const validatePassword = (password: string): string[] => {
    const errors: string[] = []

    if (password.length < 8) {
      errors.push('密码至少需要8个字符')
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('密码必须包含至少一个大写字母')
    }
    if (!/[a-z]/.test(password)) {
      errors.push('密码必须包含至少一个小写字母')
    }
    if (!/[0-9]/.test(password)) {
      errors.push('密码必须包含至少一个数字')
    }

    return errors
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setValidationErrors([])

    // 验证新密码
    const errors = validatePassword(formData.newPassword)
    if (errors.length > 0) {
      setValidationErrors(errors)
      return
    }

    // 验证密码确认
    if (formData.newPassword !== formData.confirmPassword) {
      setError('两次输入的密码不一致')
      return
    }

    // 验证不能与临时密码相同
    if (formData.currentPassword === formData.newPassword) {
      setError('新密码不能与临时密码相同')
      return
    }

    setLoading(true)

    try {
      const response = await changePassword({
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
        isForceChange: true
      })

      // 更新 token
      localStorage.setItem('token', response.token)
      onSuccess(response.token)
    } catch (err) {
      setError(err instanceof Error ? err.message : '密码修改失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">修改密码</h2>
          <p className="text-sm text-gray-600">
            您正在使用临时密码登录，请修改密码后继续使用系统。
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          {validationErrors.length > 0 && (
            <div className="mb-4 p-3 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded">
              <p className="font-semibold mb-1">密码要求：</p>
              <ul className="list-disc list-inside text-sm">
                {validationErrors.map((err, index) => (
                  <li key={index}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              当前临时密码 *
            </label>
            <input
              type="password"
              required
              value={formData.currentPassword}
              onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="输入管理员提供的临时密码"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              新密码 *
            </label>
            <input
              type="password"
              required
              value={formData.newPassword}
              onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="输入新密码"
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              确认新密码 *
            </label>
            <input
              type="password"
              required
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="再次输入新密码"
            />
          </div>

          <div className="mb-6 p-3 bg-blue-50 border border-blue-200 rounded">
            <p className="text-sm text-blue-800">
              <strong>密码要求：</strong>
            </p>
            <ul className="list-disc list-inside text-sm text-blue-700 mt-1">
              <li>至少8个字符</li>
              <li>包含至少一个大写字母</li>
              <li>包含至少一个小写字母</li>
              <li>包含至少一个数字</li>
            </ul>
          </div>

          <button
            type="submit"
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            disabled={loading}
          >
            {loading ? '修改中...' : '修改密码'}
          </button>
        </form>
      </div>
    </div>
  )
}
