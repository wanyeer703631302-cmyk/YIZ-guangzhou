import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Plus, Edit2, Trash2, Check, AlertCircle } from 'lucide-react'
import { toast } from '../../utils/toast'
import type { Tag } from '../../types/tags'

interface TagManagerProps {
  isOpen: boolean
  onClose: () => void
  tags: Tag[]
  onTagsChange: () => void
}

export function TagManager({ isOpen, onClose, tags, onTagsChange }: TagManagerProps) {
  const [localTags, setLocalTags] = useState<Tag[]>(tags)
  const [newTagName, setNewTagName] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Sync local tags with props
  useEffect(() => {
    setLocalTags(tags)
  }, [tags])

  // Clear error after 3 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [error])

  // Create new tag
  const handleCreateTag = async () => {
    const trimmedName = newTagName.trim()
    
    if (!trimmedName) {
      setError('标签名称不能为空')
      return
    }

    // Check for duplicate names (case-insensitive)
    if (localTags.some(tag => tag.name.toLowerCase() === trimmedName.toLowerCase())) {
      setError('标签名称已存在')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const response = await fetch('/api/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmedName })
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || '创建标签失败')
      }

      // Optimistic update
      setLocalTags(prev => [...prev, data.data])
      setNewTagName('')
      toast.success('标签创建成功')
      onTagsChange()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '创建标签失败'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Start editing tag
  const handleStartEdit = (tag: Tag) => {
    setEditingId(tag.id)
    setEditingName(tag.name)
    setError(null)
  }

  // Save edited tag
  const handleSaveEdit = async (tagId: string) => {
    const trimmedName = editingName.trim()
    
    if (!trimmedName) {
      setError('标签名称不能为空')
      return
    }

    // Check for duplicate names (case-insensitive), excluding current tag
    if (localTags.some(tag => tag.id !== tagId && tag.name.toLowerCase() === trimmedName.toLowerCase())) {
      setError('标签名称已存在')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const response = await fetch(`/api/tags/${tagId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmedName })
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || '更新标签失败')
      }

      // Optimistic update
      setLocalTags(prev => prev.map(tag => tag.id === tagId ? data.data : tag))
      setEditingId(null)
      setEditingName('')
      toast.success('标签更新成功')
      onTagsChange()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '更新标签失败'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Cancel editing
  const handleCancelEdit = () => {
    setEditingId(null)
    setEditingName('')
    setError(null)
  }

  // Delete tag
  const handleDeleteTag = async (tagId: string) => {
    if (!confirm('确定要删除这个标签吗？这将移除所有图片的该标签关联。')) {
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const response = await fetch(`/api/tags/${tagId}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || '删除标签失败')
      }

      // Optimistic update
      setLocalTags(prev => prev.filter(tag => tag.id !== tagId))
      toast.success('标签删除成功')
      onTagsChange()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '删除标签失败'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl bg-white dark:bg-gray-800 rounded-lg shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                管理标签
              </h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                aria-label="关闭"
              >
                <X className="w-6 h-6 text-gray-600 dark:text-gray-400" />
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mx-6 mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2"
              >
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </motion.div>
            )}

            {/* Create Tag Form */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreateTag()}
                  placeholder="输入新标签名称..."
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                />
                <button
                  onClick={handleCreateTag}
                  disabled={isSubmitting || !newTagName.trim()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus className="w-4 h-4" />
                  创建
                </button>
              </div>
            </div>

            {/* Tags List */}
            <div className="flex-1 overflow-y-auto p-6">
              {localTags.length === 0 ? (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  暂无标签，创建第一个标签吧！
                </div>
              ) : (
                <div className="space-y-2">
                  {localTags.map(tag => (
                    <div
                      key={tag.id}
                      className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg"
                    >
                      {editingId === tag.id ? (
                        <>
                          <input
                            type="text"
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveEdit(tag.id)
                              if (e.key === 'Escape') handleCancelEdit()
                            }}
                            disabled={isSubmitting}
                            className="flex-1 px-3 py-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                            autoFocus
                          />
                          <button
                            onClick={() => handleSaveEdit(tag.id)}
                            disabled={isSubmitting}
                            className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded transition-colors disabled:opacity-50"
                            aria-label="保存"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            disabled={isSubmitting}
                            className="p-2 text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors disabled:opacity-50"
                            aria-label="取消"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <>
                          <span className="flex-1 text-sm text-gray-700 dark:text-gray-300">
                            {tag.name}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {tag.imageCount || 0} 张图片
                          </span>
                          <button
                            onClick={() => handleStartEdit(tag)}
                            disabled={isSubmitting}
                            className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors disabled:opacity-50"
                            aria-label="编辑"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteTag(tag.id)}
                            disabled={isSubmitting}
                            className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors disabled:opacity-50"
                            aria-label="删除"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
