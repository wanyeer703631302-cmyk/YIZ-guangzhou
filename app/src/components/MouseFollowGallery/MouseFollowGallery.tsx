import { useEffect, useState, useRef } from 'react';
import type { GalleryItem } from '../../types/gallery';

interface MouseFollowGalleryProps {
  items: GalleryItem[];
}

export const MouseFollowGallery = ({ items }: MouseFollowGalleryProps) => {
  const [splitX, setSplitX] = useState(50);
  const [splitY, setSplitY] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const startY = useRef(0);
  const scrollStart = useRef(0);
  const [cursor, setCursor] = useState('grab');
  const scrollTimeout = useRef<number | null>(null);
  const isSnapping = useRef(false);
  const lastScrollTop = useRef(0);

  const imageGroups: GalleryItem[][] = [];
  for (let i = 0; i < items.length; i += 4) {
    imageGroups.push(items.slice(i, i + 4));
  }

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const snapToNearest = () => {
      if (isSnapping.current) return;
      
      const sectionHeight = window.innerHeight;
      const currentScroll = container.scrollTop;
      const scrollDelta = currentScroll - lastScrollTop.current;
      
      // 计算当前在哪个section
      const currentSection = currentScroll / sectionHeight;
      const currentSectionIndex = Math.floor(currentSection);
      const progress = currentSection - currentSectionIndex; // 0-1之间
      
      let targetSectionIndex;
      
      // 智能判断：如果滚动超过30%，就跳到下一屏
      if (scrollDelta > 0) {
        // 向下滚动
        targetSectionIndex = progress > 0.3 ? currentSectionIndex + 1 : currentSectionIndex;
      } else {
        // 向上滚动
        targetSectionIndex = progress < 0.7 ? currentSectionIndex : currentSectionIndex + 1;
      }
      
      // 确保不超出范围
      targetSectionIndex = Math.max(0, Math.min(imageGroups.length - 1, targetSectionIndex));
      
      const targetScroll = targetSectionIndex * sectionHeight;
      
      if (Math.abs(targetScroll - currentScroll) > 1) {
        isSnapping.current = true;
        container.scrollTo({
          top: targetScroll,
          behavior: 'smooth'
        });
        
        // 动画结束后解锁
        setTimeout(() => {
          isSnapping.current = false;
          lastScrollTop.current = targetScroll;
        }, 300);
      }
    };

    const onScroll = () => {
      if (isSnapping.current) return;
      
      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current);
      }
      
      scrollTimeout.current = window.setTimeout(() => {
        snapToNearest();
      }, 150);
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) {
        const x = (e.clientX / window.innerWidth) * 100;
        const y = (e.clientY / window.innerHeight) * 100;
        setSplitX(Math.max(15, Math.min(85, x)));
        setSplitY(Math.max(15, Math.min(85, y)));
      }
    };

    const onMouseDown = (e: MouseEvent) => {
      if (e.button !== 0) return;
      e.preventDefault();
      isDragging.current = true;
      startY.current = e.clientY;
      scrollStart.current = container.scrollTop;
      lastScrollTop.current = container.scrollTop;
      setCursor('grabbing');
    };

    const onMouseMoveWhileDrag = (e: MouseEvent) => {
      if (!isDragging.current) return;
      e.preventDefault();
      container.scrollTop = scrollStart.current + (startY.current - e.clientY);
    };

    const onMouseUp = () => {
      if (isDragging.current) {
        isDragging.current = false;
        setCursor('grab');
        // 鼠标释放后立即触发snap
        setTimeout(() => snapToNearest(), 50);
      }
    };

    const onTouchEnd = () => {
      // 触摸结束后立即触发snap
      setTimeout(() => snapToNearest(), 50);
    };

    // 初始化lastScrollTop
    lastScrollTop.current = container.scrollTop;

    container.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('mousemove', onMouseMove);
    container.addEventListener('mousedown', onMouseDown);
    document.addEventListener('mousemove', onMouseMoveWhileDrag);
    document.addEventListener('mouseup', onMouseUp);
    container.addEventListener('touchend', onTouchEnd, { passive: true });

    return () => {
      container.removeEventListener('scroll', onScroll);
      window.removeEventListener('mousemove', onMouseMove);
      container.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('mousemove', onMouseMoveWhileDrag);
      document.removeEventListener('mouseup', onMouseUp);
      container.removeEventListener('touchend', onTouchEnd);
      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current);
      }
    };
  }, [imageGroups.length]);

  return (
    <div 
      ref={containerRef} 
      style={{ 
        width: '100%', 
        height: '100vh',
        overflowY: 'scroll', 
        overflowX: 'hidden',
        cursor, 
        userSelect: 'none',
        WebkitOverflowScrolling: 'touch'
      } as React.CSSProperties}
    >
      {imageGroups.map((group, i) => (
        <section 
          key={i} 
          style={{ 
            height: '100vh',
            minHeight: '100vh',
            maxHeight: '100vh',
            position: 'relative',
            width: '100%',
            overflow: 'hidden',
            backgroundColor: '#000'
          }}
        >
          {group[0] && (
            <div style={{ 
              position: 'absolute', 
              left: 0, 
              top: 0, 
              width: splitX + '%', 
              height: splitY + '%', 
              overflow: 'hidden', 
              transition: 'width 0.3s cubic-bezier(0.17, 0.67, 0.83, 0.67), height 0.3s cubic-bezier(0.17, 0.67, 0.83, 0.67)'
            }}>
              <img 
                src={group[0].image} 
                alt={group[0].title} 
                style={{ 
                  width: '100%', 
                  height: '100%', 
                  objectFit: 'cover'
                }} 
                draggable={false} 
              />
            </div>
          )}
          {group[1] && (
            <div style={{ 
              position: 'absolute', 
              right: 0, 
              top: 0, 
              width: (100-splitX) + '%', 
              height: splitY + '%', 
              overflow: 'hidden', 
              transition: 'width 0.3s cubic-bezier(0.17, 0.67, 0.83, 0.67), height 0.3s cubic-bezier(0.17, 0.67, 0.83, 0.67)'
            }}>
              <img 
                src={group[1].image} 
                alt={group[1].title} 
                style={{ 
                  width: '100%', 
                  height: '100%', 
                  objectFit: 'cover'
                }} 
                draggable={false} 
              />
            </div>
          )}
          {group[2] && (
            <div style={{ 
              position: 'absolute', 
              left: 0, 
              bottom: 0, 
              width: splitX + '%', 
              height: (100-splitY) + '%', 
              overflow: 'hidden', 
              transition: 'width 0.3s cubic-bezier(0.17, 0.67, 0.83, 0.67), height 0.3s cubic-bezier(0.17, 0.67, 0.83, 0.67)'
            }}>
              <img 
                src={group[2].image} 
                alt={group[2].title} 
                style={{ 
                  width: '100%', 
                  height: '100%', 
                  objectFit: 'cover'
                }} 
                draggable={false} 
              />
            </div>
          )}
          {group[3] && (
            <div style={{ 
              position: 'absolute', 
              right: 0, 
              bottom: 0, 
              width: (100-splitX) + '%', 
              height: (100-splitY) + '%', 
              overflow: 'hidden', 
              transition: 'width 0.3s cubic-bezier(0.17, 0.67, 0.83, 0.67), height 0.3s cubic-bezier(0.17, 0.67, 0.83, 0.67)'
            }}>
              <img 
                src={group[3].image} 
                alt={group[3].title} 
                style={{ 
                  width: '100%', 
                  height: '100%', 
                  objectFit: 'cover'
                }} 
                draggable={false} 
              />
            </div>
          )}
          <div style={{ position: 'absolute', bottom: '32px', right: '32px', color: 'rgba(255,255,255,0.6)', fontSize: '14px', pointerEvents: 'none', zIndex: 30 }}>
            {i + 1} / {imageGroups.length}
          </div>
        </section>
      ))}
    </div>
  );
};
