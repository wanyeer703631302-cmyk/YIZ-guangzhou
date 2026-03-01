import React from 'react';
import { Heart, Bookmark } from 'lucide-react';
import { motion } from 'framer-motion';

export interface ActionButtonsProps {
  isLiked: boolean;
  isBookmarked: boolean;
  onLike: () => void;
  onBookmark: () => void;
  variant?: 'overlay' | 'modal';
}

/**
 * 可复用的操作按钮组件
 * 包含点赞和收藏按钮，支持两种变体
 */
export const ActionButtons = React.memo<ActionButtonsProps>(({
  isLiked,
  isBookmarked,
  onLike,
  onBookmark,
}) => {
  return (
    <div 
      role="group" 
      aria-label="Item actions"
      className="flex gap-2"
    >
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        transition={{ 
          type: 'spring',
          stiffness: 400,
          damping: 20
        }}
        onClick={(e) => {
          e.stopPropagation();
          onLike();
        }}
        aria-label={isLiked ? "Unlike this item" : "Like this item"}
        aria-pressed={isLiked}
        className={`w-12 h-12 rounded-full backdrop-blur-xl border flex items-center justify-center transition-colors ${
          isLiked
            ? 'bg-red-500 border-red-500 text-white'
            : 'bg-black/50 border-white/20 text-white hover:bg-black/70'
        }`}
      >
        <Heart
          className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`}
          aria-hidden="true"
        />
        <span className="sr-only">
          {isLiked ? "Liked" : "Not liked"}
        </span>
      </motion.button>

      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        transition={{ 
          type: 'spring',
          stiffness: 400,
          damping: 20
        }}
        onClick={(e) => {
          e.stopPropagation();
          onBookmark();
        }}
        aria-label={isBookmarked ? "Remove bookmark" : "Bookmark this item"}
        aria-pressed={isBookmarked}
        className={`w-12 h-12 rounded-full backdrop-blur-xl border flex items-center justify-center transition-colors ${
          isBookmarked
            ? 'bg-blue-500 border-blue-500 text-white'
            : 'bg-black/50 border-white/20 text-white hover:bg-black/70'
        }`}
      >
        <Bookmark
          className={`w-5 h-5 ${isBookmarked ? 'fill-current' : ''}`}
          aria-hidden="true"
        />
        <span className="sr-only">
          {isBookmarked ? "Bookmarked" : "Not bookmarked"}
        </span>
      </motion.button>
    </div>
  );
});

ActionButtons.displayName = 'ActionButtons';
