import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import type { GalleryItem } from '../../types/gallery';

export interface GalleryModalProps {
  item: GalleryItem | null;
  onClose: () => void;
}

/**
 * 画廊详情模态框组件
 * 显示选中项目的原图
 */
export const GalleryModal = React.memo<GalleryModalProps>(({
  item,
  onClose,
}) => {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (item) {
      // 保存之前的焦点
      previousFocusRef.current = document.activeElement as HTMLElement;
      
      // 聚焦到关闭按钮
      setTimeout(() => {
        closeButtonRef.current?.focus();
      }, 100);
      
      // 禁止背景滚动
      document.body.style.overflow = 'hidden';
      
      return () => {
        // 恢复之前的焦点
        previousFocusRef.current?.focus();
        document.body.style.overflow = '';
      };
    }
  }, [item]);

  // ESC 键关闭
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && item) {
        onClose();
      }
    };
    
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [item, onClose]);

  if (!item) return null;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key="modal-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ 
          duration: 0.3,
          ease: [0.4, 0, 0.2, 1]
        }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-xl p-4"
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        {/* Close button */}
        <motion.button
          ref={closeButtonRef}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          whileHover={{ scale: 1.1, rotate: 90 }}
          whileTap={{ scale: 0.9 }}
          transition={{ 
            type: 'spring',
            stiffness: 400,
            damping: 20
          }}
          onClick={onClose}
          aria-label="关闭"
          className="absolute top-4 right-4 z-10 w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
        >
          <X className="w-6 h-6" aria-hidden="true" />
        </motion.button>

        {/* Image */}
        <motion.div
          key={`image-${item.id}`}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ 
            type: 'spring',
            stiffness: 300,
            damping: 30,
            mass: 0.8
          }}
          className="relative max-w-[95vw] max-h-[95vh]"
          onClick={(e) => e.stopPropagation()}
        >
          <img
            src={item.image}
            alt={`${item.title} by ${item.brand}`}
            className="max-w-full max-h-[95vh] w-auto h-auto object-contain rounded-lg shadow-2xl"
            loading="eager"
          />
        </motion.div>

        {/* Hidden title for screen readers */}
        <h2 id="modal-title" className="sr-only">
          {item.title} - {item.brand}
        </h2>
      </motion.div>
    </AnimatePresence>
  );
});

GalleryModal.displayName = 'GalleryModal';
