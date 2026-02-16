'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { Heart, Download, ExternalLink, Loader2 } from 'lucide-react'
import Image from 'next/image'
import { useSession } from 'next-auth/react'

interface Asset {
  id: string
  storageUrl: string
  thumbnailUrl: string | null
  title: string | null
  description: string | null
  width: number | null
  height: number | null
  user: {
    id: string
    username: string
    avatarUrl: string | null
  }
  tags: string[]
  createdAt: string
}

interface MasonryGridProps {
  userId: string
  folderId: string | null
  searchQuery: string
  viewMode: 'grid' | 'list'
  onItemCountChange?: (count: number) => void
}

export function MasonryGrid({ userId, folderId, searchQuery, viewMode, onItemCountChange }: MasonryGridProps) {
  const { data: session } = useSession()
  const [assets, setAssets] = useState<Asset[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [likedAssets, setLikedAssets] = useState<Set<string>>(new Set())
  const observerRef = useRef<IntersectionObserver | null>(null)
  const loadMoreRef = useRef<HTMLDivElement>(null)

  const fetchAssets = useCallback(async (pageNum: number, isLoadMore = false) => {
    if (!session?.user?.id) return
    
    try {
      if (!isLoadMore) setLoading(true)
      else setLoadingMore(true)
      
      const params = new URLSearchParams({
        userId: session.user.id,
        page: pageNum.toString(),
        limit: '20',
      })
      if (folderId) params.append('folderId', folderId)
      if (searchQuery) params.append('q', searchQuery)

      const response = await fetch(`/api/assets?${params}`)
      const result = await response.json()

      if (!result.success) {
        throw new Error(result.message)
      }

      if (isLoadMore) {
        setAssets(prev => [...prev, ...result.data.items])
      } else {
        setAssets(result.data.items)
      }
      
      setHasMore(result.data.page < result.data.totalPages)
      setError(null)
      
      // 通知父组件总数变化
      onItemCountChange?.(result.data.total)
    } catch (err: any) {
      setError(err.message || '获取素材失败')
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [folderId, searchQuery, session?.user?.id, onItemCountChange])

  // 初始加载和筛选条件变化时重置
  useEffect(() => {
    setPage(1)
    setAssets([])
    fetchAssets(1, false)
  }, [folderId, searchQuery, fetchAssets])

  // 无限滚动
  useEffect(() => {
    if (observerRef.current) {
      observerRef.current.disconnect()
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          setPage(prev => {
            const nextPage = prev + 1
            fetchAssets(nextPage, true)
            return nextPage
          })
        }
      },
      { threshold: 0.1 }
    )

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current)
    }

    return () => observerRef.current?.disconnect()
  }, [hasMore, loadingMore, fetchAssets])

  const handleLike = useCallback((assetId: string) => {
    setLikedAssets(prev => {
      const newSet = new Set(prev)
      if (newSet.has(assetId)) {
        newSet.delete(assetId)
      } else {
        newSet.add(assetId)
      }
      return newSet
    })
  }, [])

  const handleDownload = useCallback(async (url: string, filename: string) => {
    try {
      const response = await fetch(url)
      const blob = await response.blob()
      const downloadUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = filename
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(downloadUrl)
    } catch (err) {
      console.error('下载失败:', err)
    }
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-500">
        <p className="text-lg mb-2">加载失败</p>
        <p className="text-sm">{error}</p>
        <button
          onClick={() => fetchAssets(1)}
          className="mt-4 px-4 py-2 bg-black text-white rounded-full text-sm hover:bg-gray-800"
        >
          重试
        </button>
      </div>
    )
  }

  if (assets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400">
        <div className="w-16 h-16 mb-4 rounded-full bg-gray-100 flex items-center justify-center">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <p className="text-lg">暂无素材</p>
        <p className="text-sm mt-1">{searchQuery ? '试试其他搜索词' : '上传第一张图片开始吧'}</p>
      </div>
    )
  }

  if (viewMode === 'list') {
    return (
      <div className="space-y-4">
        {assets.map((asset) => (
          <div key={asset.id} className="flex gap-4 bg-white p-4 rounded-xl hover:shadow-md transition-shadow">
            <div className="relative w-48 h-32 flex-shrink-0">
              <Image
                src={asset.thumbnailUrl || asset.storageUrl}
                alt={asset.title || ''}
                fill
                className="object-cover rounded-lg"
                sizes="192px"
              />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 truncate">{asset.title || '未命名'}</h3>
              <p className="text-sm text-gray-500 mt-1 line-clamp-2">{asset.description}</p>
              <div className="flex items-center gap-2 mt-2">
                {asset.user.avatarUrl ? (
                  <Image 
                    src={asset.user.avatarUrl} 
                    alt={asset.user.username} 
                    width={24} 
                    height={24} 
                    className="rounded-full" 
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-gray-200" />
                )}
                <span className="text-sm text-gray-500">{asset.user.username}</span>
              </div>
              <div className="flex gap-2 mt-3">
                {asset.tags.slice(0, 5).map((tag) => (
                  <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
        <div ref={loadMoreRef} className="h-10 flex items-center justify-center">
          {loadingMore && <Loader2 className="w-5 h-5 animate-spin text-gray-400" />}
        </div>
      </div>
    )
  }

  // Grid 模式 - 瀑布流布局
  return (
    <div className="masonry-grid">
      {assets.map((asset, index) => {
        const aspectRatio = asset.width && asset.height 
          ? asset.width / asset.height 
          : 4/3
        const isLiked = likedAssets.has(asset.id)

        return (
          <div
            key={asset.id}
            className="masonry-item group relative cursor-zoom-in"
            style={{ 
              '--masonry-aspect': aspectRatio 
            } as React.CSSProperties}
          >
            <div className="relative overflow-hidden rounded-2xl bg-gray-100">
              <Image
                src={asset.thumbnailUrl || asset.storageUrl}
                alt={asset.title || ''}
                width={asset.width || 400}
                height={asset.height || 300}
                className="w-full h-auto block transition-transform duration-300 group-hover:scale-105"
                loading={index < 8 ? 'eager' : 'lazy'}
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              />

              <div className="absolute inset-0 image-overlay opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                <div className="flex justify-between items-end gap-2">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation()
                      handleLike(asset.id)
                    }}
                    className={`px-4 py-2 rounded-full font-semibold text-sm transition-colors flex items-center gap-1 ${
                      isLiked 
                        ? 'bg-red-500 text-white' 
                        : 'bg-red-500 text-white hover:bg-red-600'
                    }`}
                  >
                    <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
                    {isLiked ? '已收藏' : '收藏'}
                  </button>
                  <div className="flex gap-2">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDownload(asset.storageUrl, `${asset.title || 'image'}.jpg`)
                      }}
                      className="bg-white/20 backdrop-blur-md p-2 rounded-full hover:bg-white/30 transition-colors text-white"
                      title="下载"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation()
                        window.open(asset.storageUrl, '_blank')
                      }}
                      className="bg-white/20 backdrop-blur-md p-2 rounded-full hover:bg-white/30 transition-colors text-white"
                      title="在新窗口打开"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-3 px-1">
              <h3 className="font-semibold text-sm text-gray-900 line-clamp-1">{asset.title || '未命名'}</h3>
              <div className="flex items-center gap-2 mt-1">
                {asset.user.avatarUrl ? (
                  <Image 
                    src={asset.user.avatarUrl} 
                    alt={asset.user.username} 
                    width={20} 
                    height={20} 
                    className="rounded-full" 
                  />
                ) : (
                  <div className="w-5 h-5 rounded-full bg-gray-200" />
                )}
                <span className="text-xs text-gray-500">{asset.user.username}</span>
              </div>
              {asset.tags.length > 0 && (
                <div className="flex gap-1 mt-2 flex-wrap">
                  {asset.tags.slice(0, 3).map((tag) => (
                    <span key={tag} className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded text-xs">
                      {tag}
                    </span>
                  ))}
                  {asset.tags.length > 3 && (
                    <span className="px-2 py-0.5 text-gray-400 text-xs">+{asset.tags.length - 3}</span>
                  )}
                </div>
              )}
            </div>
          </div>
        )
      })}
      <div ref={loadMoreRef} className="col-span-full h-20 flex items-center justify-center">
        {loadingMore && <Loader2 className="w-6 h-6 animate-spin text-gray-400" />}
        {!hasMore && assets.length > 0 && (
          <span className="text-sm text-gray-400">没有更多了</span>
        )}
      </div>
    </div>
  )
}
