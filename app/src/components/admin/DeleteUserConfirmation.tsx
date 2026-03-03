import { useState } from 'react'
import { deleteUser } from '../../services/adminApi'
import type { User } from '../../types/admin'

interface DeleteUserConfirmationProps {
  user: User
  onClose: () => void
  onSuccess: () => void
}

export function DeleteUserConfirmation({ user, onClose, onSuccess }: DeleteUserConfirmationProps) {
  const [confirmText, setConfirmText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleDelete = async () => {
    if (confirmText !== user.email) {
      setError('确认文本不匹配')
      return
    }

    setError(null)
    setLoading(true)

    try {
      await deleteUser(user.id)
      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除用户失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-4 text-red-600">删除用户</h2>

          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded">
            <p className="text-red-800 font-semibold mb-2">⚠️ 警告</p>
            <p className="text-sm text-red-700">
              此操作将永久删除用户及其所有相关数据，且无法恢复。
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          <div className="mb-4">
            <p className="text-sm text-gray-700 mb-2">
              即将删除用户：
            </p>
            <div className="p-3 bg-gray-50 rounded">
              <p className="font-semibold">{user.name}</p>
              <p className="text-sm text-gray-600">{user.email}</p>
              <p className="text-xs text-gray-500 mt-1">
                角色: {user.role === 'ADMIN' ? '管理员' : '普通用户'}
              </p>
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              请输入用户邮箱以确认删除：
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={user.email}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              disabled={loading}
            >
              取消
            </button>
            <button
              onClick={handleDelete}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              disabled={loading || confirmText !== user.email}
            >
              {loading ? '删除中...' : '确认删除'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
