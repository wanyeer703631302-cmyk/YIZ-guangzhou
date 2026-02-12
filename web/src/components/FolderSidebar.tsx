'use client'

import { useState } from 'react'
import { Folder, ChevronRight, Plus, LayoutGrid, Inbox, MoreHorizontal } from 'lucide-react'

interface FolderType {
  id: string
  name: string
  icon: string
  count: number
  color: string
  children?: FolderType[]
}

const MOCK_FOLDERS: FolderType[] = [
  { id: 'all', name: '全部素材', icon: 'layout-grid', count: 245, color: '#000000' },
  { id: 'uncat', name: '未分类', icon: 'inbox', count: 12, color: '#6B7280' },
  {
    id: 'f1',
    name: 'UI设计',
    icon: 'folder',
    count: 86,
    color: '#3B82F6',
    children: [
      { id: 'f1-1', name: '移动端', icon: 'folder', count: 45, color: '#60A5FA' },
      { id: 'f1-2', name: 'Web端', icon: 'folder', count: 41, color: '#60A5FA' },
    ],
  },
  { id: 'f2', name: '营销素材', icon: 'folder', count: 64, color: '#10B981' },
  { id: 'f3', name: '产品截图', icon: 'folder', count: 32, color: '#F59E0B' },
  { id: 'f4', name: '灵感收藏', icon: 'heart', count: 128, color: '#EF4444' },
]

const MOCK_TAGS = [
  { name: '界面设计', color: '#3B82F6', count: 45 },
  { name: '图标', color: '#10B981', count: 32 },
  { name: '插画', color: '#8B5CF6', count: 28 },
  { name: '摄影', color: '#F59E0B', count: 56 },
  { name: '配色', color: '#EC4899', count: 23 },
]

interface FolderSidebarProps {
  selectedFolder: string | null
  onSelectFolder: (id: string | null) => void
}

export function FolderSidebar({ selectedFolder, onSelectFolder }: FolderSidebarProps) {
  const [expandedFolders, setExpandedFolders] = useState<string[]>(['f1'])
  const [isCreating, setIsCreating] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')

  const toggleExpand = (folderId: string) => {
    setExpandedFolders((prev) =>
      prev.includes(folderId) ? prev.filter((id) => id !== folderId) : [...prev, folderId]
    )
  }

  const renderFolder = (folder: FolderType, depth = 0) => {
    const isExpanded = expandedFolders.includes(folder.id)
    const hasChildren = folder.children && folder.children.length > 0
    const isSelected = selectedFolder === folder.id || (folder.id === 'all' && !selectedFolder)

    return (
      <div key={folder.id}>
        <button
          onClick={() => onSelectFolder(folder.id === 'all' ? null : folder.id)}
          className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-colors group ${
            isSelected ? 'bg-black text-white' : 'hover:bg-gray-100 text-gray-700'
          }`}
          style={{ paddingLeft: `${depth * 12 + 12}px` }}
        >
          <button
            onClick={(e) => {
              e.stopPropagation()
              toggleExpand(folder.id)
            }}
            className={`p-0.5 rounded hover:bg-gray-200 ${isSelected ? 'hover:bg-gray-700' : ''} ${
              hasChildren ? 'visible' : 'invisible'
            }`}
          >
            <ChevronRight className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
          </button>

          <Folder className="w-5 h-5" style={{ color: isSelected ? 'white' : folder.color }} />

          <span className="flex-1 font-medium text-sm truncate">{folder.name}</span>

          <span className={`text-xs ${isSelected ? 'text-gray-300' : 'text-gray-400'}`}>
            {folder.count}
          </span>
        </button>

        {isExpanded &&
          folder.children?.map((child) => renderFolder(child, depth + 1))}
      </div>
    )
  }

  return (
    <aside className="w-64 bg-white border-r border-gray-200 h-[calc(100vh-129px)] sticky top-[129px] overflow-y-auto">
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-900 text-sm">文件夹</h3>
          <button
            onClick={() => setIsCreating(true)}
            className="p-2 hover:bg-gray-100 rounded-full text-gray-600 transition-colors"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-1">
          {MOCK_FOLDERS.map((folder) => renderFolder(folder))}
        </div>

        {isCreating && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <input
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="文件夹名称"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black mb-2"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={() => setIsCreating(false)}
                className="flex-1 bg-gray-200 text-gray-700 py-1.5 rounded-lg text-sm font-medium hover:bg-gray-300"
              >
                取消
              </button>
            </div>
          </div>
        )}

        <div className="mt-8">
          <h3 className="font-bold text-gray-900 mb-3 text-sm">热门标签</h3>
          <div className="flex flex-wrap gap-2">
            {MOCK_TAGS.map((tag) => (
              <span
                key={tag.name}
                className="px-3 py-1 rounded-full text-xs font-medium cursor-pointer hover:opacity-80 transition-opacity"
                style={{
                  backgroundColor: tag.color + '20',
                  color: tag.color,
                  border: `1px solid ${tag.color}40`,
                }}
              >
                #{tag.name}
              </span>
            ))}
          </div>
        </div>
      </div>
    </aside>
  )
}
