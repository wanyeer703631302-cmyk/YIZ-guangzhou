'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import { UserTabs } from '@/components/UserTabs'
import { FolderSidebar } from '@/components/FolderSidebar'
import { MasonryGrid } from '@/components/MasonryGrid'
import { UploadModal } from '@/components/UploadModal'
import { Search, Plus, LayoutGrid, List, LogOut } from 'lucide-react'

const MOCK_USERS = [
  { id: 'u1', name: '张设计', avatar: 'https://i.pravatar.cc/150?u=1', count: 128 },
  { id: 'u2', name: '李产品', avatar: 'https://i.pravatar.cc/150?u=2', count: 86 },
  { id: 'u3', name: '王市场', avatar: 'https://i.pravatar.cc/150?u=3', count: 245 },
  { id: 'u4', name: '陈运营', avatar: 'https://i.pravatar.cc/150?u=4', count: 167 },
  { id: 'u5', name: '刘开发', avatar: 'https://i.pravatar.cc/150?u=5', count: 43 },
]

export default function Home() {
  const { data: session, status } = useSession()
  const [currentUserId, setCurrentUserId] = useState('u1')
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showUpload, setShowUpload] = useState(false)

  if (status === 'loading') {
    return <div className="flex items-center justify-center min-h-screen">加载中...</div>
  }

  if (!session) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-[1920px] mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                </svg>
              </div>
              <span className="text-xl font-bold">PinCollect</span>
            </div>

            <div className="flex-1 max-w-2xl mx-8">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="搜索素材、标签、文件夹..."
                  className="w-full pl-10 pr-4 py-2 bg-gray-100 border-none rounded-full focus:outline-none focus:ring-2 focus:ring-gray-200"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowUpload(true)}
                className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-full font-medium hover:bg-gray-800 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">上传</span>
              </button>

              <div className="flex items-center gap-2">
                <img
                  src={session.user?.image || 'https://i.pravatar.cc/150?u=admin'}
                  alt={session.user?.name || 'User'}
                  className="w-10 h-10 rounded-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>

        {/* User Tabs */}
        <div className="border-t border-gray-100 bg-white/80 backdrop-blur-md">
          <div className="max-w-[1920px] mx-auto px-4">
            <UserTabs
              users={MOCK_USERS}
              currentUserId={currentUserId}
              onSelectUser={setCurrentUserId}
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex max-w-[1920px] mx-auto">
        <FolderSidebar
          selectedFolder={selectedFolder}
          onSelectFolder={setSelectedFolder}
        />

        <main className="flex-1 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span>128 个素材</span>
              <span className="w-1 h-1 bg-gray-300 rounded-full" />
              <span>刚刚更新</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-gray-100 text-gray-900' : 'text-gray-400 hover:bg-gray-100'}`}
              >
                <LayoutGrid className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-gray-100 text-gray-900' : 'text-gray-400 hover:bg-gray-100'}`}
              >
                <List className="w-5 h-5" />
              </button>
            </div>
          </div>

          <MasonryGrid
            userId={currentUserId}
            folderId={selectedFolder}
            searchQuery={searchQuery}
            viewMode={viewMode}
          />
        </main>
      </div>

      {showUpload && <UploadModal onClose={() => setShowUpload(false)} folderId={selectedFolder} />}
    </div>
  )
}
