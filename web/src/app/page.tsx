'use client'

import { useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'
import { redirect } from 'next/navigation'
import { UserTabs } from '@/components/UserTabs'
import { MasonryGrid } from '@/components/MasonryGrid'
import { UploadModal } from '@/components/UploadModal'
import { Search, Plus, LayoutGrid, List, LogOut } from 'lucide-react'
import { signOut } from 'next-auth/react'
import dynamic from 'next/dynamic'

// 动态导入 FolderSidebar，禁用 SSR
const FolderSidebar = dynamic(
  () => import('@/components/FolderSidebar').then(mod => mod.FolderSidebar),
  { ssr: false }
)

// ... 其余代码保持不变

// ... 剩下的代码不变

export default function Home() {
  const { data: session, status } = useSession()
  const [currentUserId, setCurrentUserId] = useState('u1')
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showUpload, setShowUpload] = useState(false)

  // 🌟 新增状态：存储从数据库获取的素材
  const [materials, setMaterials] = useState([])

  // 🌟 新增：页面加载时请求数据库数据
  useEffect(() => {
    const fetchMaterials = async () => {
      try {
        const res = await fetch('/api/materials')
        const data = await res.json()
        setMaterials(data)
      } catch (err) {
        console.error("加载素材失败", err)
      }
    }
    fetchMaterials()
  }, []) // 依赖项为空，表示只在页面第一次加载时运行

  // ... 加载状态和登录检查逻辑不变

  return (
    <div className="min-h-screen">
      {/* Header 部分不变 ... */}
      
      {/* Main Content */}
      <div className="flex max-w-[1920px] mx-auto">
        <FolderSidebar
          selectedFolder={selectedFolder}
          onSelectFolder={setSelectedFolder}
        />

        <main className="flex-1 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4 text-sm text-gray-600">
              {/* 🌟 修改这里：显示真实的素材数量 */}
              <span>{materials.length} 个素材</span>
              <span className="w-1 h-1 bg-gray-300 rounded-full" />
              <span>刚刚更新</span>
            </div>
            {/* ... 视图切换按钮部分不变 */}
          </div>

          {/* 🌟 修改这里：将数据库数据传给 MasonryGrid */}
          <MasonryGrid
            items={materials} // 传入真实数据
            userId={currentUserId}
            folderId={selectedFolder}
            searchQuery={searchQuery}
            viewMode={viewMode}
          />
        </main>
      </div>

      {/* 这里的 onClose 可以加一个刷新数据的逻辑 */}
      {showUpload && <UploadModal onClose={() => {
        setShowUpload(false)
        window.location.reload() // 上传后刷新页面以加载新图
      }} folderId={selectedFolder} />}
    </div>
  )
}
