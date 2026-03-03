import { useState, useEffect, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Search, Settings } from 'lucide-react'
import type { Tag } from '../../types/tags'

interface FilterPanelProps {
  isOpen: boolean
  onClose: () => void
  tags: Tag[]
  selectedTagIds: string[]
  onTagToggle: (tagId: string) => void
  onManageTags: () => void
  isLoading?: boolean
}

export function FilterPanel({
  isOpen,
  onClose,
  tags,
  selectedTagIds,
  onTagToggle,
  onManageTags,
  isLoading = false
}: FilterPanelProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const panelRef = useRef<HTMLDivElement>(null)

  // Filter tags based on search query - memoized for performance
  const filteredTags = useMemo(() => {
    if (!searchQuery) return tags
    const lowerQuery = searchQuery.toLowerCase()
    return tags.filter(tag => tag.name.toLowerCase().includes(lowerQuery))
  }, [tags, searchQuery])

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, onClose])

  // Close on ESC key
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      return () => document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, onClose])

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={panelRef}
          initial={{ opacity: 0, x: 20, y: 20 }}
          animate={{ opacity: 1, x: 0, y: 0 }}
          exit={{ opacity: 0, x: 20, y: 20 }}
          className="fixed bottom-24 right-5 z-40 w-80 max-h-[32rem] bg-white dark:bg-gray-800 rounded-lg shadow-2xl overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              筛选标签
            </h3>
            <div className="flex items-center gap-2">
              <button
                onClick={onManageTags}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                aria-label="管理标签"
              >
                <Settings className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                aria-label="关闭"
              >
                <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索标签..."
                className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Tags List */}
          <div className="flex-1 overflow-y-auto p-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            ) : filteredTags.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                {searchQuery ? '未找到匹配的标签' : '暂无标签'}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredTags.map(tag => {
                  const isSelected = selectedTagIds.includes(tag.id)
                  return (
                    <label
                      key={tag.id}
                      className="flex items-center gap-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onTagToggle(tag.id)}
                        className="w-4 h-4 text-blue-500 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="flex-1 text-sm text-gray-700 dark:text-gray-300">
                        {tag.name}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {tag.imageCount || 0}
                      </span>
                    </label>
                  )
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          {selectedTagIds.length > 0 && (
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => selectedTagIds.forEach(id => onTagToggle(id))}
                className="w-full py-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
              >
                清除所有筛选 ({selectedTagIds.length})
              </button>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
