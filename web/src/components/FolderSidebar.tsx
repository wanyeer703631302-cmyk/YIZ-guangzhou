'use client'

import { useEffect, useState, useCallback } from 'react'
import { Folder, Plus, ChevronRight, Loader2 } from 'lucide-react'
import { useSession } from 'next-auth/react'

interface FolderItem {
  id: string
  name: string
  color: string
  icon: string
  isSystem: boolean
  assetCount: number
  parentId: string | null
}

interface FolderSidebarProps {
  selectedFolder: string | null
  onSelectFolder: (id: string | null) => void
}

export function FolderSidebar({ selectedFolder, onSelectFolder }: FolderSidebarProps) {
  const { data: session } = useSession()
  const [folders, setFolders] = useState<FolderItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')

  const fetchFolders = useCallback(async () => {
    if (!session?.user?.id) return

    try {
      setLoading(true)
      const response = await fetch('/api/folders')
      const result = await response.json()

      if (!result.success) {
        throw new Error(result.message)
      }

      setFolders(result.data)
      setError(null)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [session?.user?.id])

  useEffect(() => {
    fetchFolders()
  }, [fetchFolders])

  const handleCreateFolder = async () => {
    if (!newFolderName.trim() || !session?.user?.id) return

    try {
      const response = await fetch('/api/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newFolderName.trim(),
        }),
      })

      const result = await response.json()
      if (!result.success) {
        throw new Error(result.message)
      }

      setFolders(prev => [...prev, { ...result.data, assetCount: 0 }])
      setNewFolderName('')
      setIsCreating(false)
    } catch (err: any) {
      alert('创建失败: ' + err.message)
    }
  }

  const totalCount = folders.reduce((sum, f) => sum + f.assetCount, 0)

  if (loading) {
    return (
      <aside className="w-64 flex-shrink-0 border-r border-gray-200 p-4">
        <div className="flex items-center justify-center py-10">
          <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
        </div>
      </aside>
    )
  }

  return (
    <aside className="w-64 flex-shrink-0 border-r border-gray-200 min-h-[calc(100vh-128px)]">
      <div className="p-4">
        <button
          onClick={() => onSelectFolder(null)}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            selectedFolder === null
              ? 'bg-black text-white'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          <span className="flex items-center gap-2">
            <Folder className="w-4 h-4" />
            全部素材
          </span>
          <span className="text-xs opacity-70">{totalCount}</span>
        </button>
      </div>

      <div className="px-4 pb-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">文件夹</span>
          <button
            onClick={() => setIsCreating(true)}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
            title="新建文件夹"
          >
            <Plus className="w-4 h-4 text-gray-500" />
          </button>
        </div>
      </div>

      {isCreating && (
        <div className="px-4 mb-3">
          <div className="flex gap-2">
            <input
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreateFolder()
                if (e.key === 'Escape') setIsCreating(false)
              }}
              placeholder="文件夹名称"
              autoFocus
              className="flex-1 px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
            />
            <button
              onClick={handleCreateFolder}
              disabled={!newFolderName.trim()}
              className="px-3 py-1.5 bg-black text-white text-sm rounded-lg hover:bg-gray-800 disabled:opacity-50"
            >
              创建
            </button>
          </div>
        </div>
      )}

      <div className="px-2">
        {folders.length === 0 ? (
          <p className="px-4 py-3 text-sm text-gray-400">暂无文件夹</p>
        ) : (
          <nav className="space-y-1">
            {folders.map((folder) => (
              <button
                key={folder.id}
                onClick={() => onSelectFolder(folder.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors group ${
                  selectedFolder === folder.id
                    ? 'bg-gray-100 text-gray-900'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <span className="flex items-center gap-2 truncate">
                  <span
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: folder.color }}
                  />
                  <span className="truncate">{folder.name}</span>
                </span>
                <span className={`text-xs ${
                  selectedFolder === folder.id ? 'text-gray-500' : 'text-gray-400 group-hover:text-gray-500'
                }`}>
                  {folder.assetCount}
                </span>
              </button>
            ))}
          </nav>
        )}
      </div>
    </aside>
  )
}
