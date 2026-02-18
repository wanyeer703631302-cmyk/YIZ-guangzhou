'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { Heart, Star, Loader2 } from 'lucide-react'
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
  userId?: string
  folderId: string | null
  searchQuery: string
  viewMode: 'grid' | 'list'
  likedOnly?: boolean
  levelTag?: string
  onItemCountChange?: (count: number) => void
}

export function MasonryGrid({ userId, folderId, searchQuery, viewMode, likedOnly, levelTag, onItemCountChange }: MasonryGridProps) {
  const { data: session } = useSession()
  const [assets, setAssets] = useState<Asset[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [likedAssets, setLikedAssets] = useState<Set<string>>(new Set())
  const [favoritedAssets, setFavoritedAssets] = useState<Set<string>>(new Set())
  const [collections, setCollections] = useState<{ id: string; name: string; itemCount?: number }[]>([])
  const [collectionAsset, setCollectionAsset] = useState<Asset | null>(null)
  const [collectionIds, setCollectionIds] = useState<Set<string>>(new Set())
  const [newCollectionName, setNewCollectionName] = useState('')
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null)
  const [showLevelPicker, setShowLevelPicker] = useState(false)
  const [selectedAssetLevel, setSelectedAssetLevel] = useState<string | null>(null)
  const observerRef = useRef<IntersectionObserver | null>(null)
  const loadMoreRef = useRef<HTMLDivElement>(null)

  const fetchAssets = useCallback(async (pageNum: number, isLoadMore = false) => {
    if (!session?.user?.id) return
    
    try {
      if (!isLoadMore) setLoading(true)
      else setLoadingMore(true)
      
      const params = new URLSearchParams({
        page: pageNum.toString(),
        limit: '20',
      })
      if (userId) params.append('userId', userId)
      if (folderId) params.append('folderId', folderId)
      if (searchQuery) params.append('q', searchQuery)
      if (likedOnly) params.append('liked', 'true')
      if (levelTag) params.append('tag', levelTag)

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
  }, [folderId, searchQuery, userId, likedOnly, levelTag, session?.user?.id, onItemCountChange])

  // 初始加载和筛选条件变化时重置
  useEffect(() => {
    setPage(1)
    setAssets([])
    fetchAssets(1, false)
  }, [folderId, searchQuery, fetchAssets])

  useEffect(() => {
    const fetchLikesAndFavorites = async () => {
      if (!session?.user?.id) return
      try {
        const [likesRes, favoritesRes, collectionsRes] = await Promise.all([
          fetch('/api/likes?page=1&limit=200'),
          fetch('/api/favorites?page=1&limit=200'),
          fetch('/api/collections')
        ])
        const likesResult = await likesRes.json()
        const favoritesResult = await favoritesRes.json()
        const collectionsResult = await collectionsRes.json()
        if (likesResult.success) {
          setLikedAssets(new Set((likesResult.data.items || []).map((i: any) => i.assetId)))
        }
        if (favoritesResult.success) {
          setFavoritedAssets(new Set((favoritesResult.data.items || []).map((i: any) => i.assetId)))
        }
        if (collectionsResult.success) {
          setCollections(collectionsResult.data || [])
        }
      } catch (e) {}
    }
    fetchLikesAndFavorites()
  }, [session?.user?.id])

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

  useEffect(() => {
    if (!selectedAsset) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedAsset(null)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [selectedAsset])

  const handleLike = useCallback(async (assetId: string) => {
    if (!session?.user?.id) return
    const isLiked = likedAssets.has(assetId)
    try {
      const res = await fetch('/api/likes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assetId }),
      })
      const result = await res.json()
      if (!result.success) throw new Error(result.message)
      setLikedAssets(prev => {
        const next = new Set(prev)
        if (isLiked) next.delete(assetId)
        else next.add(assetId)
        return next
      })
    } catch (e) {}
  }, [session?.user?.id, likedAssets])

  const handleFavorite = useCallback(async (assetId: string) => {
    if (!session?.user?.id) return
    const isFavorited = favoritedAssets.has(assetId)
    try {
      const res = await fetch('/api/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assetId }),
      })
      const result = await res.json()
      if (!result.success) throw new Error(result.message)
      setFavoritedAssets(prev => {
        const next = new Set(prev)
        if (isFavorited) next.delete(assetId)
        else next.add(assetId)
        return next
      })
    } catch (e) {}
  }, [session?.user?.id, favoritedAssets])

  const openCollections = useCallback(async (asset: Asset) => {
    setCollectionAsset(asset)
    try {
      const res = await fetch(`/api/collections/items?assetId=${asset.id}`)
      const result = await res.json()
      if (result.success) {
        setCollectionIds(new Set(result.data || []))
      }
    } catch (e) {}
  }, [])

  const toggleCollection = useCallback(async (collectionId: string) => {
    if (!collectionAsset) return
    const isIn = collectionIds.has(collectionId)
    setCollectionIds(prev => {
      const next = new Set(prev)
      if (isIn) next.delete(collectionId)
      else next.add(collectionId)
      return next
    })
    try {
      const res = await fetch('/api/collections/items', {
        method: isIn ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ collectionId, assetId: collectionAsset.id }),
      })
      const result = await res.json()
      if (!result.success) throw new Error(result.message)
    } catch (e) {
      setCollectionIds(prev => {
        const next = new Set(prev)
        if (isIn) next.add(collectionId)
        else next.delete(collectionId)
        return next
      })
    }
  }, [collectionAsset, collectionIds])

  const createCollection = useCallback(async () => {
    if (!newCollectionName.trim()) return
    try {
      const res = await fetch('/api/collections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCollectionName.trim() }),
      })
      const result = await res.json()
      if (!result.success) throw new Error(result.message)
      setCollections(prev => [result.data, ...prev])
      setNewCollectionName('')
    } catch (e) {}
  }, [newCollectionName])

  const deleteCollection = useCallback(async (id: string) => {
    try {
      const res = await fetch('/api/collections', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      const result = await res.json()
      if (!result.success) throw new Error(result.message)
      setCollections(prev => prev.filter(c => c.id !== id))
      setCollectionIds(prev => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
    } catch (e) {}
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

  const content = viewMode === 'list' ? (
    <div className="space-y-4">
      {assets.map((asset) => (
        <div
          key={asset.id}
          className="flex gap-4 bg-white p-4 rounded-xl hover:shadow-md transition-shadow cursor-zoom-in"
          onClick={() => setSelectedAsset(asset)}
        >
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
  ) : (
    <div className="masonry-grid">
      {assets.map((asset, index) => {
        const aspectRatio = asset.width && asset.height 
          ? asset.width / asset.height 
          : 4/3
        const isLiked = likedAssets.has(asset.id)
        const isFavorited = favoritedAssets.has(asset.id)

        return (
          <div
            key={asset.id}
            className="masonry-item group relative cursor-zoom-in"
            style={{ 
              '--masonry-aspect': aspectRatio 
            } as React.CSSProperties}
          >
            <div
              className="relative overflow-hidden rounded-2xl bg-gray-100"
              onClick={() => setSelectedAsset(asset)}
            >
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
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleLike(asset.id)
                      }}
                      className="bg-white/20 backdrop-blur-md w-10 h-10 rounded-full hover:bg-white/30 transition-colors flex items-center justify-center"
                      title="点赞"
                    >
                      <Heart className={`w-5 h-5 ${isLiked ? 'text-red-500 fill-red-500 scale-110' : 'text-white'}`} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleFavorite(asset.id)
                        openCollections(asset)
                      }}
                      className="bg-white/20 backdrop-blur-md w-10 h-10 rounded-full hover:bg-white/30 transition-colors flex items-center justify-center"
                      title="收藏"
                    >
                      <Star className={`w-5 h-5 ${isFavorited ? 'text-yellow-400 fill-yellow-400 scale-110' : 'text-white'}`} />
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

  return (
    <>
      {content}
      {selectedAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-6" onClick={() => setSelectedAsset(null)}>
          <div className="max-w-6xl w-full" onClick={(e) => e.stopPropagation()}>
            <div className="relative w-full rounded-2xl overflow-hidden bg-black">
              <img
                src={selectedAsset.storageUrl}
                alt={selectedAsset.title || ''}
                className="w-full h-auto max-h-[80vh] object-contain"
              />
            </div>
            <div className="mt-4 flex items-center justify-between text-white">
              <div>
                <div className="text-lg font-semibold">{selectedAsset.title || '未命名'}</div>
                <div className="text-sm text-white/70">{selectedAsset.user.username}</div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowLevelPicker((v)=>!v)}
                  className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center"
                >
                  <Heart className={`w-5 h-5 ${
                    selectedAssetLevel === '夯' ? 'text-red-500 fill-red-500' :
                    selectedAssetLevel === '顶级' ? 'text-yellow-400 fill-yellow-400' :
                    selectedAssetLevel === '人上人' ? 'text-purple-500 fill-purple-500' :
                    'text-white'
                  }`} />
                </button>
                <button
                  onClick={() => {
                    handleFavorite(selectedAsset.id)
                    openCollections(selectedAsset)
                  }}
                  className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center"
                >
                  <Star className={`w-5 h-5 ${favoritedAssets.has(selectedAsset.id) ? 'text-yellow-400 fill-yellow-400 scale-110' : 'text-white'}`} />
                </button>
              </div>
            </div>
          </div>
          {showLevelPicker && (
            <div className="absolute top-4 right-20 z-50">
              <div className="bg-white rounded-lg shadow-lg border p-2 flex gap-2">
                {['夯','顶级','人上人'].map((l) => (
                  <button
                    key={l}
                    onClick={async () => {
                      try {
                        await fetch('/api/assets/level', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ assetId: selectedAsset?.id, level: l })
                        })
                        setSelectedAssetLevel(l)
                        setShowLevelPicker(false)
                      } catch {}
                    }}
                    className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded text-sm"
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      {collectionAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-6" onClick={() => setCollectionAsset(null)}>
          <div className="w-full max-w-md rounded-2xl bg-white p-6" onClick={(e) => e.stopPropagation()}>
            <div className="text-lg font-semibold mb-3">收藏到分类</div>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {collections.length === 0 && (
                <div className="text-sm text-gray-500">暂无分类</div>
              )}
              {collections.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 cursor-pointer"
                  onClick={() => toggleCollection(c.id)}
                >
                  <div className="flex items-center gap-3 text-sm">
                    <span className={`w-5 h-5 rounded border flex items-center justify-center ${collectionIds.has(c.id) ? 'bg-black border-black' : 'border-gray-300'}`}>
                      {collectionIds.has(c.id) && <span className="w-2.5 h-2.5 bg-white rounded-sm" />}
                    </span>
                    <span>{c.name}</span>
                    {typeof c.itemCount === 'number' && <span className="text-xs text-gray-400">({c.itemCount})</span>}
                  </div>
                  <button className="text-xs text-gray-400 hover:text-gray-600" onClick={(e) => { e.stopPropagation(); deleteCollection(c.id) }}>
                    删除
                  </button>
                </div>
              ))}
            </div>
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setCollectionAsset(null)}
                className="px-4 py-2 bg-black text-white text-sm rounded-lg hover:bg-gray-800"
              >
                确认
              </button>
            </div>
            <div className="mt-4 flex gap-2">
              <input
                value={newCollectionName}
                onChange={(e) => setNewCollectionName(e.target.value)}
                placeholder="新建分类"
                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black"
              />
              <button
                onClick={createCollection}
                className="px-4 py-2 bg-black text-white text-sm rounded-lg hover:bg-gray-800"
              >
                创建
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
