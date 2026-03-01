import { useState, useCallback } from 'react';
import type { GalleryItem } from '../types/gallery';

interface UseGalleryStateOptions {
  items: GalleryItem[];
  initialLikes?: Set<number>;
  initialBookmarks?: Set<number>;
  onLike?: (itemId: number) => void;
  onBookmark?: (itemId: number) => void;
  onItemSelect?: (item: GalleryItem) => void;
}

interface UseGalleryStateReturn {
  hoveredIndex: number | null;
  setHoveredIndex: (index: number | null) => void;
  selectedItem: GalleryItem | null;
  setSelectedItem: (item: GalleryItem | null) => void;
  likes: Set<number>;
  bookmarks: Set<number>;
  toggleLike: (itemId: number) => void;
  toggleBookmark: (itemId: number) => void;
  isLiked: (itemId: number) => boolean;
  isBookmarked: (itemId: number) => boolean;
}

/**
 * 画廊状态管理 Hook
 * 管理悬停、选中、点赞、收藏状态
 */
export function useGalleryState(
  options: UseGalleryStateOptions
): UseGalleryStateReturn {
  const {
    items,
    initialLikes = new Set<number>(),
    initialBookmarks = new Set<number>(),
    onLike,
    onBookmark,
    onItemSelect,
  } = options;

  // 悬停项索引状态
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  
  // 选中项状态
  const [selectedItem, setSelectedItemState] = useState<GalleryItem | null>(null);
  
  // 点赞状态
  const [likes, setLikes] = useState<Set<number>>(initialLikes);
  
  // 收藏状态
  const [bookmarks, setBookmarks] = useState<Set<number>>(initialBookmarks);

  // 设置选中项（带回调）
  const setSelectedItem = useCallback((item: GalleryItem | null) => {
    setSelectedItemState(item);
    if (item && onItemSelect) {
      onItemSelect(item);
    }
  }, [onItemSelect]);

  // 切换点赞状态（不可变更新）
  const toggleLike = useCallback((itemId: number) => {
    setLikes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
    
    if (onLike) {
      onLike(itemId);
    }
  }, [onLike]);

  // 切换收藏状态（不可变更新）
  const toggleBookmark = useCallback((itemId: number) => {
    setBookmarks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
    
    if (onBookmark) {
      onBookmark(itemId);
    }
  }, [onBookmark]);

  // 查询点赞状态
  const isLiked = useCallback((itemId: number) => {
    return likes.has(itemId);
  }, [likes]);

  // 查询收藏状态
  const isBookmarked = useCallback((itemId: number) => {
    return bookmarks.has(itemId);
  }, [bookmarks]);

  return {
    hoveredIndex,
    setHoveredIndex,
    selectedItem,
    setSelectedItem,
    likes,
    bookmarks,
    toggleLike,
    toggleBookmark,
    isLiked,
    isBookmarked,
  };
}
