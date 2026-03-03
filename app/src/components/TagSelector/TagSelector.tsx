import { useState } from 'react'
import { X, Plus, AlertCircle } from 'lucide-react'
import { apiClient } from '../../services/api'
import { toast } from '../../utils/toast'
import type { Tag } from '../../types/tags'

interface TagSelectorProps {
  assetId: string
  currentTags: Tag[]
  allTags: Tag[]
  onTagsChange?: () => void
}

export function TagSelector({
  assetId,
  currentTags,
  allTags,
  onTagsChange
}: TagSelectorProps) {
  const [localCurrentTags, setLocalCurrentTags] = useState<Tag[]>(currentTags)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loadingTagId, setLoadingTagId] = useState<string | null>(null)

  // Get available tags (not already added)
  const availableTags = allTags.filter(
    tag => !localCurrentTags.some(ct => ct.id === tag.id)
  )

  // Handle add tag
  const handleAddTag = async (tagId: string) => {
    setLoadingTagId(tagId)
    setError(null)

    try {
      const response = await apiClient.addTagToAsset(assetId, tagId)
      
      if (!response.success) {
        throw new Error(response.error || '添加标签失败')
      }

      // Optimistic update
      const addedTag = allTags.find(t => t.id === tagId)
      if (addedTag) {
        setLocalCurrentTags(prev => [...prev, addedTag])
      }
      
      setIsDropdownOpen(false)
      toast.success('标签添加成功')
      onTagsChange?.()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '添加标签失败'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoadingTagId(null)
    }
  }

  // Handle remove tag
  const handleRemoveTag = async (tagId: string) => {
    setLoadingTagId(tagId)
    setError(null)

    try {
      const response = await apiClient.removeTagFromAsset(assetId, tagId)
      
      if (!response.success) {
        throw new Error(response.error || '移除标签失败')
      }

      // Optimistic update
      setLocalCurrentTags(prev => prev.filter(t => t.id !== tagId))
      toast.success('标签移除成功')
      onTagsChange?.()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '移除标签失败'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoadingTagId(null)
    }
  }

  return (
    <div className="space-y-2">
      {/* Current Tags */}
      <div className="flex flex-wrap gap-2">
        {localCurrentTags.map(tag => (
          <div
            key={tag.id}
            className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm"
          >
            <span>{tag.name}</span>
            <button
              onClick={() => handleRemoveTag(tag.id)}
              disabled={loadingTagId === tag.id}
              className="hover:bg-blue-200 dark:hover:bg-blue-800/50 rounded-full p-0.5 transition-colors disabled:opacity-50"
              aria-label={`移除标签 ${tag.name}`}
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}

        {/* Add Tag Button */}
        {availableTags.length > 0 && (
          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full text-sm hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              <Plus className="w-3 h-3" />
              添加标签
            </button>

            {/* Dropdown */}
            {isDropdownOpen && (
              <div className="absolute top-full left-0 mt-1 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-10 max-h-48 overflow-y-auto">
                {availableTags.map(tag => (
                  <button
                    key={tag.id}
                    onClick={() => handleAddTag(tag.id)}
                    disabled={loadingTagId === tag.id}
                    className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 first:rounded-t-lg last:rounded-b-lg"
                  >
                    {tag.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-sm text-red-600 dark:text-red-400">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  )
}
