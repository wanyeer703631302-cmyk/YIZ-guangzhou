/**
 * 用户交互Hook
 * 管理点赞和收藏功能
 */

import { useState, useEffect, useCallback } from 'react'
import { apiClient } from '../services/api'
import type { Like, Favorite } from '../types/api'

interface InteractionsState {
  likes: Map<string, string> // assetId -> likeId
  favorites: Map<string, string> // assetId -> favoriteId
  isLoading: boolean
  error: string | null
}

export const useInteractions = () => {
  const [state, setState] = useState<InteractionsState>({
    likes: new Map(),
    favorites: new Map(),
    isLoading: true,
    error: null,
  })

  // 加载用户交互数据
  const loadInteractions = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }))
    
    const response = await apiClient.getUserInteractions()
    
    if (response.success && response.data) {
      const likesMap = new Map<string, string>()
      const favoritesMap = new Map<string, string>()
      
      response.data.likes.forEach((like: Like) => {
        likesMap.set(like.assetId, like.id)
      })
      
      response.data.favorites.forEach((favorite: Favorite) => {
        favoritesMap.set(favorite.assetId, favorite.id)
      })
      
      setState({
        likes: likesMap,
        favorites: favoritesMap,
        isLoading: false,
        error: null,
      })
    } else {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: response.error || '加载交互数据失败',
      }))
    }
  }, [])

  // 初始加载
  useEffect(() => {
    loadInteractions()
  }, [loadInteractions])

  // 切换点赞状态
  const toggleLike = useCallback(async (assetId: string) => {
    const likeId = state.likes.get(assetId)
    
    if (likeId) {
      // 取消点赞
      const response = await apiClient.deleteLike(likeId)
      
      if (response.success) {
        setState(prev => {
          const newLikes = new Map(prev.likes)
          newLikes.delete(assetId)
          return { ...prev, likes: newLikes }
        })
      } else {
        console.error('取消点赞失败:', response.error)
      }
    } else {
      // 创建点赞
      const response = await apiClient.createLike(assetId)
      
      if (response.success && response.data) {
        setState(prev => {
          const newLikes = new Map(prev.likes)
          newLikes.set(assetId, response.data!.id)
          return { ...prev, likes: newLikes }
        })
      } else {
        console.error('点赞失败:', response.error)
      }
    }
  }, [state.likes])

  // 切换收藏状态
  const toggleFavorite = useCallback(async (assetId: string) => {
    const favoriteId = state.favorites.get(assetId)
    
    if (favoriteId) {
      // 取消收藏
      const response = await apiClient.deleteFavorite(favoriteId)
      
      if (response.success) {
        setState(prev => {
          const newFavorites = new Map(prev.favorites)
          newFavorites.delete(assetId)
          return { ...prev, favorites: newFavorites }
        })
      } else {
        console.error('取消收藏失败:', response.error)
      }
    } else {
      // 创建收藏
      const response = await apiClient.createFavorite(assetId)
      
      if (response.success && response.data) {
        setState(prev => {
          const newFavorites = new Map(prev.favorites)
          newFavorites.set(assetId, response.data!.id)
          return { ...prev, favorites: newFavorites }
        })
      } else {
        console.error('收藏失败:', response.error)
      }
    }
  }, [state.favorites])

  // 检查是否已点赞
  const isLiked = useCallback((assetId: string) => {
    return state.likes.has(assetId)
  }, [state.likes])

  // 检查是否已收藏
  const isFavorited = useCallback((assetId: string) => {
    return state.favorites.has(assetId)
  }, [state.favorites])

  return {
    isLoading: state.isLoading,
    error: state.error,
    toggleLike,
    toggleFavorite,
    isLiked,
    isFavorited,
    reload: loadInteractions,
  }
}
