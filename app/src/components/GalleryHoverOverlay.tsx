import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Bookmark } from 'lucide-react';

interface GalleryHoverOverlayProps {
  isVisible: boolean;
  isLiked: boolean;
  isBookmarked: boolean;
  onLike: () => void;
  onBookmark: () => void;
  meshBounds: { left: number; top: number; width: number; height: number } | null;
}

export const GalleryHoverOverlay = ({
  isVisible,
  isLiked,
  isBookmarked,
  onLike,
  onBookmark,
  meshBounds,
}: GalleryHoverOverlayProps) => {
  if (!meshBounds) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ 
            duration: 0.3,
            ease: [0.17, 0.67, 0.83, 0.67]
          }}
          className="fixed pointer-events-none z-40"
          style={{
            left: meshBounds.left,
            top: meshBounds.top,
            width: meshBounds.width,
            height: meshBounds.height,
          }}
        >
          {/* 渐变蒙层 - 从底部淡入 */}
          <motion.div 
            className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ 
              duration: 0.3,
              ease: 'easeOut'
            }}
          />
          
          {/* 底部右下角的操作按钮 - 从底部滑入 */}
          <div className="absolute bottom-3 right-3 flex gap-2 pointer-events-auto">
            <motion.button
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              transition={{ 
                duration: 0.3,
                ease: 'easeOut',
                delay: 0.05
              }}
              whileHover={{ 
                scale: 1.1,
                transition: { 
                  type: 'spring',
                  stiffness: 400,
                  damping: 20
                }
              }}
              whileTap={{ 
                scale: 0.9,
                transition: { 
                  type: 'spring',
                  stiffness: 400,
                  damping: 20
                }
              }}
              onClick={(e) => {
                e.stopPropagation();
                onLike();
              }}
              className={`w-10 h-10 rounded-full backdrop-blur-md border flex items-center justify-center transition-colors duration-200 ${
                isLiked
                  ? 'bg-red-500/90 border-red-400 text-white'
                  : 'bg-white/10 border-white/30 text-white hover:bg-white/20'
              }`}
              aria-label={isLiked ? '取消点赞' : '点赞'}
            >
              <Heart
                className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`}
              />
            </motion.button>
            
            <motion.button
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              transition={{ 
                duration: 0.3,
                ease: 'easeOut',
                delay: 0.1
              }}
              whileHover={{ 
                scale: 1.1,
                transition: { 
                  type: 'spring',
                  stiffness: 400,
                  damping: 20
                }
              }}
              whileTap={{ 
                scale: 0.9,
                transition: { 
                  type: 'spring',
                  stiffness: 400,
                  damping: 20
                }
              }}
              onClick={(e) => {
                e.stopPropagation();
                onBookmark();
              }}
              className={`w-10 h-10 rounded-full backdrop-blur-md border flex items-center justify-center transition-colors duration-200 ${
                isBookmarked
                  ? 'bg-yellow-500/90 border-yellow-400 text-white'
                  : 'bg-white/10 border-white/30 text-white hover:bg-white/20'
              }`}
              aria-label={isBookmarked ? '取消收藏' : '收藏'}
            >
              <Bookmark
                className={`w-5 h-5 ${isBookmarked ? 'fill-current' : ''}`}
              />
            </motion.button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
