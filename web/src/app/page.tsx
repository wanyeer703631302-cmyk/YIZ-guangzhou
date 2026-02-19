'use client'

import { useState, useCallback, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import { FolderSidebar } from '@/components/FolderSidebar'
import { MasonryGrid } from '@/components/MasonryGrid'
import { UploadModal } from '@/components/UploadModal'
import { UserTabs } from '@/components/UserTabs'
import { LayoutGrid, List } from 'lucide-react'
import { Navbar } from '@/components/Navbar'

export default function Home() {
  const { data: session, status } = useSession()
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showUpload, setShowUpload] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const [isSearching, setIsSearching] = useState(false)
  const [activeUserId, setActiveUserId] = useState<string | null>(null)
  const [tabsUsers, setTabsUsers] = useState<{ id: string; name: string; avatar: string; count: number }[]>([])
  const [levelTab, setLevelTab] = useState<'夯' | '顶级' | '人上人'>('夯')

  const handleRefresh = useCallback(() => {
    setRefreshKey(prev => prev + 1)
  }, [])

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch('/api/home/users')
        const result = await res.json()
        if (result.success && Array.isArray(result.data)) {
          setTabsUsers(result.data)
        } else {
          console.error('获取用户列表失败:', result.message)
          setTabsUsers([])
        }
      } catch (error) {
        console.error('获取用户列表出错:', error)
        setTabsUsers([])
      }
    }
    fetchUsers()
  }, [])

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-gray-200 border-t-black rounded-full animate-spin" />
      </div>
    )
  }

  if (status === 'unauthenticated' || !session) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar 
        user={session.user}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onUploadClick={() => setShowUpload(true)}
      />

      <div className="flex max-w-[1920px] mx-auto">
        <FolderSidebar
          selectedFolder={selectedFolder}
          onSelectFolder={setSelectedFolder}
        />

        <main className="flex-1 p-6">
          {/* Toolbar */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span className="font-medium">
                {selectedFolder ? '当前文件夹' : activeUserId ? '用户作品' : `${levelTab} 内容`}
              </span>
              {searchQuery && (
                <>
                  <span className="w-1 h-1 bg-gray-300 rounded-full" />
                  <span className="text-gray-500">搜索: {searchQuery}</span>
                </>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'grid' ? 'bg-gray-100 text-gray-900' : 'text-gray-400 hover:bg-gray-100'
                }`}
                title="网格视图"
              >
                <LayoutGrid className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'list' ? 'bg-gray-100 text-gray-900' : 'text-gray-400 hover:bg-gray-100'
                }`}
                title="列表视图"
              >
                <List className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* 等级 Tabs + 用户头像 */}
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              {(['夯','顶级','人上人'] as const).map(l => (
                <button
                  key={l}
                  onClick={() => { setActiveUserId(null); setLevelTab(l) }}
                  className={`px-3 py-1.5 rounded-full text-sm ${!activeUserId && levelTab===l ? 'bg-black text-white' : 'bg-gray-100 text-gray-700'}`}
                >
                  {l}
                </button>
              ))}
            </div>
            {tabsUsers.length > 0 && (
              <UserTabs
                users={tabsUsers}
                currentUserId={activeUserId || ''}
                onSelectUser={(id) => setActiveUserId(id)}
              />
            )}
          </div>

          {/* Content */}
          <MasonryGrid
            key={refreshKey}
            userId={activeUserId || undefined}
            folderId={selectedFolder}
            searchQuery={searchQuery}
            viewMode={viewMode}
            likedOnly={false}
            levelTag={!activeUserId ? levelTab : undefined}
            sourceType={!activeUserId && levelTab === '夯' ? 'hang' : 'assets'}
          />
        </main>
      </div>

      {/* Upload Modal */}
      {showUpload && (
        <UploadModal
          onClose={() => setShowUpload(false)}
          folderId={selectedFolder}
          onUploadSuccess={() => {
            handleRefresh()
            setShowUpload(false)
          }}
        />
      )}
    </div>
  )
}
