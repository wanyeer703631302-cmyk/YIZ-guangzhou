import { useState, useEffect } from 'react';
import * as THREE from 'three';
import { GALLERY_CONFIG } from '../constants/gallery';

interface UseImageLoaderOptions {
  images: string[];
  onProgress?: (loaded: number, total: number) => void;
  onComplete?: () => void;
  onError?: (error: Error) => void;
}

interface UseImageLoaderReturn {
  textures: THREE.Texture[];
  isLoading: boolean;
  progress: number;
  error: Error | null;
}

/**
 * 创建圆角矩形纹理
 */
function createRoundedRectTexture(image: HTMLImageElement, radius: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  
  canvas.width = image.width;
  canvas.height = image.height;

  // 绘制圆角路径
  ctx.beginPath();
  ctx.moveTo(radius, 0);
  ctx.lineTo(canvas.width - radius, 0);
  ctx.quadraticCurveTo(canvas.width, 0, canvas.width, radius);
  ctx.lineTo(canvas.width, canvas.height - radius);
  ctx.quadraticCurveTo(canvas.width, canvas.height, canvas.width - radius, canvas.height);
  ctx.lineTo(radius, canvas.height);
  ctx.quadraticCurveTo(0, canvas.height, 0, canvas.height - radius);
  ctx.lineTo(0, radius);
  ctx.quadraticCurveTo(0, 0, radius, 0);
  ctx.closePath();
  ctx.clip();

  // 绘制图片
  ctx.drawImage(image, 0, 0);
  
  return canvas;
}

/**
 * 压缩纹理（如果尺寸超过最大值）
 */
function compressTexture(image: HTMLImageElement, maxSize: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  
  if (image.width > maxSize || image.height > maxSize) {
    const scale = Math.min(maxSize / image.width, maxSize / image.height);
    canvas.width = image.width * scale;
    canvas.height = image.height * scale;
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
  } else {
    canvas.width = image.width;
    canvas.height = image.height;
    ctx.drawImage(image, 0, 0);
  }
  
  return canvas;
}

/**
 * 图片加载 Hook
 * 并行加载图片，应用圆角处理，创建 Three.js 纹理
 */
export function useImageLoader(options: UseImageLoaderOptions): UseImageLoaderReturn {
  const { images, onProgress, onComplete, onError } = options;
  
  const [textures, setTextures] = useState<THREE.Texture[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (images.length === 0) {
      setIsLoading(false);
      return;
    }

    const loadedTextures: THREE.Texture[] = new Array(images.length);
    let loadedCount = 0;
    const totalCount = images.length;

    images.forEach((imageUrl, idx) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        try {
          // 压缩纹理（如果需要）
          const compressedCanvas = compressTexture(img, GALLERY_CONFIG.TEXTURE.MAX_TEXTURE_SIZE);
          
          // 创建临时图片用于圆角处理
          const tempImg = new Image();
          tempImg.onload = () => {
            // 应用圆角处理
            const roundedCanvas = createRoundedRectTexture(
              tempImg,
              GALLERY_CONFIG.TEXTURE.CORNER_RADIUS
            );
            
            // 创建 Three.js 纹理
            const texture = new THREE.CanvasTexture(roundedCanvas);
            texture.colorSpace = THREE.SRGBColorSpace;
            loadedTextures[idx] = texture;
            
            loadedCount++;
            const currentProgress = Math.round((loadedCount / totalCount) * 100);
            setProgress(currentProgress);
            
            if (onProgress) {
              onProgress(loadedCount, totalCount);
            }
            
            if (loadedCount === totalCount) {
              setTextures(loadedTextures);
              setIsLoading(false);
              if (onComplete) {
                onComplete();
              }
            }
          };
          
          tempImg.src = compressedCanvas.toDataURL();
        } catch (err) {
          console.error(`Failed to process image ${idx}:`, err);
          loadedCount++;
          
          if (loadedCount === totalCount) {
            setTextures(loadedTextures);
            setIsLoading(false);
            if (onComplete) {
              onComplete();
            }
          }
        }
      };
      
      img.onerror = () => {
        const err = new Error(`Failed to load image: ${imageUrl}`);
        console.error(err);
        
        if (onError) {
          onError(err);
        }
        
        setError(err);
        loadedCount++;
        
        if (loadedCount === totalCount) {
          setTextures(loadedTextures);
          setIsLoading(false);
          if (onComplete) {
            onComplete();
          }
        }
      };
      
      img.src = imageUrl;
    });

    // Cleanup
    return () => {
      loadedTextures.forEach(texture => {
        if (texture) {
          texture.dispose();
        }
      });
    };
  }, [images, onProgress, onComplete, onError]);

  return {
    textures,
    isLoading,
    progress,
    error,
  };
}
