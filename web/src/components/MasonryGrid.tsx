'use client'

import { useEffect, useState } from 'react'
import { Heart, Download, ExternalLink } from 'lucide-react'

interface Asset {
  id: string
  url: string
  title: string
  user: {
    name: string
    avatar: string
  }
  width: number
  height: number
  tags: string[]
}

interface MasonryGridProps {
  userId: string
  folderId: string | null
  searchQuery: string
  viewMode: 'grid' | 'list'
}

export function MasonryGrid({ userId, folderId, searchQuery, viewMode }: MasonryGridProps) {
  const [assets, setAssets] = useState<Asset[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 模拟加载数据
    setLoading(true)
    const timer = setTimeout(() => {
      const newAssets: Asset[] = Array.from({ length: 20 }, (_, i) => ({
        id: `${userId}-${i}`,
        url: `https://picsum.photos/seed/${userId}${i}${folderId || ''}/400/${Math.floor(Math.random() * 300 + 300)}`,
        title: `设计素材 ${i + 1}`,
        user: {
          name: '张设计',
          avatar: `https://i.pravatar.cc/150?u=${userId}`,
        },
        width: 400,
        height: Math.floor(Math.random() * 300 + 300),
        tags: ['设计', '灵感', 'UI'],
      }))
      setAssets(newAssets)
      setLoading(false)
    }, 500)

    return () => clearTimeout(timer)
  }, [userId, folderId, searchQuery])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-gray-200 border-t-black rounded-full animate-spin" />
      </div>
    )
  }

  if (viewMode === 'list') {
    return (
      <div className="space-y-4">
        {assets.map((asset) => (
          <div key={asset.id} className="flex gap-4 bg-white p-4 rounded-xl hover:shadow-md transition-shadow">
            <img src={asset.url} alt={asset.title} className="w-48 h-32 object-cover rounded-lg" />
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">{asset.title}</h3>
              <div className="flex items-center gap-2 mt-2">
                <img src={asset.user.avatar} alt={asset.user.name} className="w-6 h-6 rounded-full" />
                <span className="text-sm text-gray-500">{asset.user.name}</span>
              </div>
              <div className="flex gap-2 mt-3">
                {asset.tags.map((tag) => (
                  <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="masonry-grid">
      {assets.map((asset) => (
        <div
          key={asset.id}
          className="masonry-item group relative cursor-zoom-in"
        >
          <div className="relative overflow-hidden rounded-2xl bg-gray-100">
            <img
              src={asset.url}
              alt={asset.title}
              className="w-full h-auto block transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />

            <div className="absolute inset-0 image-overlay opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
              <div className="flex justify-between items-end">
                <button className="bg-red-500 text-white px-4 py-2 rounded-full font-semibold text-sm hover:bg-red-600 transition-colors flex items-center gap-1">
                  <Heart className="w-4 h-4" />
                  保存
                </button>
                <div className="flex gap-2">
                  <button className="bg-white/20 backdrop-blur-md p-2 rounded-full hover:bg-white/30 transition-colors text-white">
                    <Download className="w-4 h-4" />
                  </button>
                  <button className="bg-white/20 backdrop-blur-md p-2 rounded-full hover:bg-white/30 transition-colors text-white">
                    <ExternalLink className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-3 px-1">
            <h3 className="font-semibold text-sm text-gray-900 line-clamp-1">{asset.title}</h3>
            <div className="flex items-center gap-2 mt-1">
              <img src={asset.user.avatar} alt={asset.user.name} className="w-5 h-5 rounded-full" />
              <span className="text-xs text-gray-500">{asset.user.name}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
