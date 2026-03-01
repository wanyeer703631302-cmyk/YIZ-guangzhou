import { useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { throttle } from '../utils/performance/throttle';
import { GALLERY_CONFIG } from '../constants/gallery';
import type { GalleryItem } from '../types/gallery';

interface UseGalleryInteractionOptions {
  container: HTMLDivElement | null;
  camera: THREE.OrthographicCamera | null;
  meshes: THREE.Mesh[];
  items: GalleryItem[];
  velocityRef: React.MutableRefObject<{ x: number; y: number }>;
  targetOffsetRef: React.MutableRefObject<{ x: number; y: number }>;
  targetDistortionRef: React.MutableRefObject<number>;
  isDraggingRef: React.MutableRefObject<boolean>;
  wheelTimeoutRef: React.MutableRefObject<number | null>;
  onHoverChange?: (index: number | null) => void;
  onItemClick?: (item: GalleryItem) => void;
}

/**
 * 画廊交互 Hook
 * 处理拖拽、悬停检测、滚轮和扭曲效果
 */
export function useGalleryInteraction(options: UseGalleryInteractionOptions): void {
  const { 
    container, 
    camera, 
    meshes, 
    items, 
    velocityRef,
    targetOffsetRef,
    targetDistortionRef,
    isDraggingRef,
    wheelTimeoutRef,
    onHoverChange, 
    onItemClick 
  } = options;
  
  const raycasterRef = useRef<THREE.Raycaster>(new THREE.Raycaster());
  const previousMouseRef = useRef({ x: 0, y: 0 });
  const dragStartPosRef = useRef({ x: 0, y: 0 });
  const hasMovedRef = useRef(false);

  // 节流的悬停检测
  const throttledHoverDetection = useCallback(
    throttle((e: PointerEvent) => {
      if (!container || !camera || isDraggingRef.current) return;

      const rect = container.getBoundingClientRect();
      const mouse = new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1
      );

      raycasterRef.current.setFromCamera(mouse, camera);
      const intersects = raycasterRef.current.intersectObjects(meshes);

      if (intersects.length > 0) {
        const itemIndex = intersects[0].object.userData.itemIndex;
        if (onHoverChange) {
          onHoverChange(itemIndex);
        }
        container.style.cursor = 'pointer';
      } else {
        if (onHoverChange) {
          onHoverChange(null);
        }
        container.style.cursor = 'grab';
      }
    }, GALLERY_CONFIG.INTERACTION.HOVER_THROTTLE_MS),
    [container, camera, meshes, onHoverChange]
  );

  // 指针按下事件
  const onPointerDown = useCallback((e: PointerEvent) => {
    isDraggingRef.current = true;
    hasMovedRef.current = false;
    dragStartPosRef.current = { x: e.clientX, y: e.clientY };
    previousMouseRef.current = { x: e.clientX, y: e.clientY };
    velocityRef.current = { x: 0, y: 0 };
  }, []);

  // 指针移动事件
  const onPointerMove = useCallback((e: PointerEvent) => {
    if (!container) return;

    if (!isDraggingRef.current) {
      // 非拖拽状态：悬停检测
      throttledHoverDetection(e);
      return;
    }

    // 拖拽状态
    container.style.cursor = 'grabbing';
    if (onHoverChange) {
      onHoverChange(null);
    }

    // 检测是否移动超过阈值
    const moveDistance = Math.sqrt(
      Math.pow(e.clientX - dragStartPosRef.current.x, 2) +
      Math.pow(e.clientY - dragStartPosRef.current.y, 2)
    );
    if (moveDistance > GALLERY_CONFIG.INTERACTION.DRAG_THRESHOLD) {
      hasMovedRef.current = true;
    }

    // 计算移动增量
    const deltaX = (e.clientX - previousMouseRef.current.x) / window.innerWidth;
    const deltaY = (e.clientY - previousMouseRef.current.y) / window.innerHeight;
    
    // 直接更新目标位置（拖拽时立即响应）
    const moveDelta = { x: deltaX * 2, y: deltaY * 2 };
    targetOffsetRef.current.x += moveDelta.x;
    targetOffsetRef.current.y += moveDelta.y;
    
    // 记录速度用于惯性
    velocityRef.current.x = moveDelta.x;
    velocityRef.current.y = moveDelta.y;

    // 根据速度计算扭曲强度（使用速度的平方避免 sqrt）
    const speedSquared = velocityRef.current.x ** 2 + velocityRef.current.y ** 2;
    targetDistortionRef.current = Math.min(
      speedSquared * 50, // 调整系数补偿平方
      GALLERY_CONFIG.DISTORTION.MAX_DISTORTION
    );

    previousMouseRef.current = { x: e.clientX, y: e.clientY };
  }, [container, onHoverChange, throttledHoverDetection]);

  // 指针抬起事件
  const onPointerUp = useCallback((e: PointerEvent) => {
    if (!container || !camera) return;

    const wasDragging = isDraggingRef.current;
    isDraggingRef.current = false;
    targetDistortionRef.current = 0;

    // 只有在没有拖拽移动时才触发点击
    if (wasDragging && !hasMovedRef.current) {
      const rect = container.getBoundingClientRect();
      const mouse = new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1
      );

      raycasterRef.current.setFromCamera(mouse, camera);
      const intersects = raycasterRef.current.intersectObjects(meshes);

      if (intersects.length > 0 && onItemClick) {
        const itemIndex = intersects[0].object.userData.itemIndex;
        onItemClick(items[itemIndex]);
      }
    }

    hasMovedRef.current = false;
    container.style.cursor = 'grab';
  }, [container, camera, meshes, items, onItemClick]);

  // 滚轮事件
  const onWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    
    targetOffsetRef.current.y += e.deltaY * GALLERY_CONFIG.INTERACTION.WHEEL_SPEED;
    
    const wheelSpeed = Math.abs(e.deltaY) * 0.003;
    targetDistortionRef.current = Math.min(
      wheelSpeed,
      GALLERY_CONFIG.DISTORTION.MAX_DISTORTION
    );

    if (wheelTimeoutRef.current) {
      window.clearTimeout(wheelTimeoutRef.current);
    }
    
    wheelTimeoutRef.current = window.setTimeout(() => {
      targetDistortionRef.current = 0;
      wheelTimeoutRef.current = null;
    }, GALLERY_CONFIG.INTERACTION.WHEEL_DISTORTION_DURATION);
  }, []);

  // 事件监听器
  useEffect(() => {
    if (!container) return;

    container.addEventListener('pointerdown', onPointerDown);
    container.addEventListener('pointermove', onPointerMove);
    container.addEventListener('pointerup', onPointerUp);
    container.addEventListener('pointerleave', onPointerUp);
    container.addEventListener('wheel', onWheel, { passive: false });

    return () => {
      container.removeEventListener('pointerdown', onPointerDown);
      container.removeEventListener('pointermove', onPointerMove);
      container.removeEventListener('pointerup', onPointerUp);
      container.removeEventListener('pointerleave', onPointerUp);
      container.removeEventListener('wheel', onWheel);
      
      if (wheelTimeoutRef.current) {
        window.clearTimeout(wheelTimeoutRef.current);
      }
    };
  }, [container, onPointerDown, onPointerMove, onPointerUp, onWheel]);
}
