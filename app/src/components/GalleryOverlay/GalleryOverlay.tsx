import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ActionButtons } from '../ActionButtons';
import type { GalleryItem } from '../../types/gallery';

export interface GalleryOverlayProps {
  hoveredItem: GalleryItem | null;
  isLiked: boolean;
  isBookmarked: boolean;
  onLike: () => void;
  onBookmark: () => void;
}

/**
 * 画廊悬停叠加层组件
 * 在悬停时显示操作按钮
 */
export const GalleryOverlay = React.memo<GalleryOverlayProps>(({
  hoveredItem,
  isLiked,
  isBookmarked,
  onLike,
  onBookmark,
}) => {
  // 检测用户的运动偏好
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const animationConfig = prefersReducedMotion
    ? {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
        transition: { duration: 0 }
      }
    : {
        initial: { opacity: 0, scale: 0.8 },
        animate: { opacity: 1, scale: 1 },
        exit: { opacity: 0, scale: 0.8 },
        transition: { 
          type: 'spring',
          stiffness: 400,
          damping: 25
        }
      };

  return (
    <AnimatePresence>
      {hoveredItem && (
        <motion.div
          {...animationConfig}
          className="fixed top-4 right-4 z-50"
        >
          <ActionButtons
            isLiked={isLiked}
            isBookmarked={isBookmarked}
            onLike={onLike}
            onBookmark={onBookmark}
            variant="overlay"
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
});

GalleryOverlay.displayName = 'GalleryOverlay';
