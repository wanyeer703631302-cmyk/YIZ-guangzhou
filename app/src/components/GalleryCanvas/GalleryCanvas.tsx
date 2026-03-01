import { useRef, useEffect, memo } from 'react';
import { useImageLoader } from '../../hooks/useImageLoader';
import { useThreeScene } from '../../hooks/useThreeScene';
import { useGalleryInteraction } from '../../hooks/useGalleryInteraction';
import type { GalleryItem } from '../../types/gallery';

interface GalleryCanvasProps {
  items: GalleryItem[];
  onHoverChange?: (index: number | null) => void;
  onItemClick?: (item: GalleryItem) => void;
  onLoadComplete?: () => void;
}

/**
 * 画廊画布组件
 * 封装 Three.js 渲染逻辑，集成场景管理和交互处理
 */
export const GalleryCanvas = memo(({
  items,
  onHoverChange,
  onItemClick,
  onLoadComplete,
}: GalleryCanvasProps) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // 创建交互所需的 refs
  const velocityRef = useRef({ x: 0, y: 0 });
  const targetOffsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const targetDistortionRef = useRef(0);
  const isDraggingRef = useRef(false);
  const wheelTimeoutRef = useRef<number | null>(null);

  // 加载图片纹理
  const { textures, isLoading } = useImageLoader({
    images: items.map(item => item.image),
    onComplete: onLoadComplete,
  });

  // Three.js 场景（传入交互 refs）
  const { sceneRefs, meshes } = useThreeScene({
    container: containerRef.current,
    items,
    textures,
    velocityRef,
    targetOffsetRef,
    targetDistortionRef,
    isDraggingRef,
    wheelTimeoutRef,
  });

  // 交互处理（使用场景的 refs，但不返回 refs）
  useGalleryInteraction({
    container: containerRef.current,
    camera: sceneRefs?.camera || null,
    meshes,
    items,
    onHoverChange,
    onItemClick,
    velocityRef,
    targetOffsetRef,
    targetDistortionRef,
    isDraggingRef,
    wheelTimeoutRef,
  });

  // 设置初始光标样式
  useEffect(() => {
    if (containerRef.current && !isLoading) {
      containerRef.current.style.cursor = 'grab';
    }
  }, [isLoading]);

  return <div ref={containerRef} className="w-full h-full" />;
});
