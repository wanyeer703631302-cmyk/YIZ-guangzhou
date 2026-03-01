import { useState, useEffect } from 'react'
import { apiClient } from '../services/api'
import type { Asset } from '../types/api'
import type { GalleryItem } from '../types/gallery'

interface UseAssetsReturn {
  items: GalleryItem[]
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
}

/**
 * 将API Asset转换为GalleryItem格式
 */
function assetToGalleryItem(asset: Asset): GalleryItem {
  return {
    id: parseInt(asset.id, 36) || Math.random(), // 转换字符串ID为数字
    assetId: asset.id, // 保留原始字符串ID用于API调用
    title: asset.title,
    brand: 'Unknown', // API Asset没有brand字段，使用默认值
    category: asset.tags?.map(tag => tag.name) || [],
    year: new Date(asset.createdAt).getFullYear().toString(),
    image: asset.thumbnailUrl, // 使用thumbnailUrl作为纹理加载源
    color: 'from-blue-500/20 to-purple-500/20', // 默认渐变色
  }
}

/**
 * 资源加载Hook
 * 从API获取资源列表并转换为GalleryItem格式
 */
export function useAssets(): UseAssetsReturn {
  const [items, setItems] = useState<GalleryItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAssets = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await apiClient.getAssets()

      if (response.success && response.data) {
        const galleryItems = response.data.items.map(assetToGalleryItem)
        setItems(galleryItems)
      } else {
        setError(response.error || '加载资源失败')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '网络错误')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchAssets()
  }, [])

  return {
    items,
    isLoading,
    error,
    refetch: fetchAssets,
  }
}
