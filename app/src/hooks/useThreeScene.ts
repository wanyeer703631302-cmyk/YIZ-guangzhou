import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { DistortionShader } from '../utils/three/shaders';
import { calculateGridLayout, createGridMeshes } from '../utils/three/gridLayout';
import { GALLERY_CONFIG } from '../constants/gallery';
import type { GalleryItem, ThreeSceneRefs, GalleryOffset } from '../types/gallery';

interface UseThreeSceneOptions {
  container: HTMLDivElement | null;
  items: GalleryItem[];
  textures: THREE.Texture[];
  velocityRef: React.MutableRefObject<{ x: number; y: number }>;
  targetOffsetRef: React.MutableRefObject<GalleryOffset>;
  targetDistortionRef: React.MutableRefObject<number>;
  isDraggingRef: React.MutableRefObject<boolean>;
  wheelTimeoutRef: React.MutableRefObject<number | null>;
}

interface UseThreeSceneReturn {
  sceneRefs: ThreeSceneRefs | null;
  meshes: THREE.Mesh[];
  gridOffset: React.MutableRefObject<GalleryOffset>;
  currentDistortion: React.MutableRefObject<number>;
  isReady: boolean;
  error: Error | null;
}

/**
 * Three.js 场景管理 Hook
 * 负责场景、相机、渲染器初始化，网格创建，渲染循环和资源清理
 */
export function useThreeScene(options: UseThreeSceneOptions): UseThreeSceneReturn {
  const { 
    container, 
    items, 
    textures,
    velocityRef,
    targetOffsetRef,
    targetDistortionRef,
    isDraggingRef,
    wheelTimeoutRef
  } = options;
  
  const sceneRefsRef = useRef<ThreeSceneRefs | null>(null);
  const meshesRef = useRef<THREE.Mesh[]>([]);
  const animationIdRef = useRef<number | null>(null);
  const gridOffsetRef = useRef<GalleryOffset>({ x: 0, y: 0 });
  const currentDistortionRef = useRef(0);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!container) return;
    if (textures.length === 0) return;

    // 防止重复初始化
    if (sceneRefsRef.current) {
      return;
    }

    try {
      // 检查 WebGL 支持
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (!gl) {
        throw new Error('WebGL is not supported in this browser');
      }

      // 场景初始化
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x000000);

      // 相机初始化
      const aspect = container.clientWidth / container.clientHeight;
      const camera = new THREE.OrthographicCamera(-aspect, aspect, 1, -1, 0.1, 100);
      camera.position.z = 1;

      // 渲染器初始化
      const renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setSize(container.clientWidth, container.clientHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, GALLERY_CONFIG.RENDERING.MAX_PIXEL_RATIO));
      container.appendChild(renderer.domElement);

      // 后处理管线
      const composer = new EffectComposer(renderer);
      composer.addPass(new RenderPass(scene, camera));
      const distortionPass = new ShaderPass(DistortionShader);
      composer.addPass(distortionPass);

      // 网格组
      const gridGroup = new THREE.Group();
      scene.add(gridGroup);

      // 创建网格
      const gridConfig = calculateGridLayout(aspect);
      const meshes = createGridMeshes(textures, items, gridConfig, gridGroup);
      meshesRef.current = meshes;

      // Raycaster for interaction
      const raycaster = new THREE.Raycaster();

      // 保存场景引用
      sceneRefsRef.current = {
        scene,
        camera,
        renderer,
        composer,
        distortionPass,
        gridGroup,
        meshes: meshesRef.current,
        raycaster,
      };

      // 窗口大小调整处理
      const handleResize = () => {
        const width = container.clientWidth;
        const height = container.clientHeight;
        const newAspect = width / height;
        
        camera.left = -newAspect;
        camera.right = newAspect;
        camera.updateProjectionMatrix();
        
        renderer.setSize(width, height);
        composer.setSize(width, height);
      };

      window.addEventListener('resize', handleResize);

      setIsReady(true);

      // 启动渲染循环
      let lastTime = performance.now();
      let frameCount = 0;
      let fps = 0;

      const animate = () => {
        animationIdRef.current = requestAnimationFrame(animate);

        // FPS 计算
        frameCount++;
        const currentTime = performance.now();
        if (currentTime >= lastTime + 1000) {
          fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
          frameCount = 0;
          lastTime = currentTime;
          if (fps < 50) {
            console.warn('Low FPS:', fps);
          }
        }

        // 应用惯性衰减（仅在非拖拽状态）
        if (!isDraggingRef.current) {
          // 应用速度到目标位置
          targetOffsetRef.current.x += velocityRef.current.x;
          targetOffsetRef.current.y += velocityRef.current.y;
          
          // 衰减速度
          velocityRef.current.x *= GALLERY_CONFIG.INTERACTION.INERTIA_DAMPING;
          velocityRef.current.y *= GALLERY_CONFIG.INTERACTION.INERTIA_DAMPING;

          // 根据速度更新扭曲（仅在非滚轮状态）
          if (!wheelTimeoutRef.current) {
            const speed = Math.sqrt(
              velocityRef.current.x ** 2 + velocityRef.current.y ** 2
            );
            targetDistortionRef.current = speed > 0.001
              ? Math.min(speed * 6, GALLERY_CONFIG.DISTORTION.MAX_DISTORTION)
              : 0;
          }
        }

        // 位置更新 - 拖拽时直接应用，非拖拽时平滑插值
        if (isDraggingRef.current) {
          // 拖拽时：直接应用目标位置，无延迟
          gridOffsetRef.current.x = targetOffsetRef.current.x;
          gridOffsetRef.current.y = targetOffsetRef.current.y;
        } else {
          // 非拖拽时：平滑插值
          gridOffsetRef.current.x += (targetOffsetRef.current.x - gridOffsetRef.current.x) * 0.15;
          gridOffsetRef.current.y += (targetOffsetRef.current.y - gridOffsetRef.current.y) * 0.15;
        }
        
        // 扭曲效果 - 拖拽时更快响应
        const distortionLerpFactor = isDraggingRef.current ? 0.3 : 0.1;
        currentDistortionRef.current += (targetDistortionRef.current - currentDistortionRef.current) * distortionLerpFactor;

        // 更新扭曲效果
        distortionPass.uniforms.distortion.value = currentDistortionRef.current;

        // 更新网格位置
        gridGroup.position.set(gridOffsetRef.current.x, gridOffsetRef.current.y, 0);

        // 渲染
        composer.render();
      };

      animationIdRef.current = requestAnimationFrame(animate);

      // 清理函数
      return () => {
        window.removeEventListener('resize', handleResize);
        
        if (animationIdRef.current !== null) {
          cancelAnimationFrame(animationIdRef.current);
          animationIdRef.current = null;
        }

        // 清理网格
        meshesRef.current.forEach(mesh => {
          mesh.geometry.dispose();
          if (mesh.material instanceof THREE.Material) {
            mesh.material.dispose();
          }
        });
        meshesRef.current = [];

        // 清理场景
        gridGroup.clear();
        scene.clear();

        // 清理渲染器
        renderer.dispose();
        composer.dispose();
        
        if (container.contains(renderer.domElement)) {
          container.removeChild(renderer.domElement);
        }

        sceneRefsRef.current = null;
      };
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to initialize Three.js scene');
      console.error('useThreeScene error:', error);
      setError(error);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [container]); // 只依赖 container，textures 和 items 在初始化后不应改变

  return {
    sceneRefs: sceneRefsRef.current,
    meshes: meshesRef.current,
    gridOffset: gridOffsetRef,
    currentDistortion: currentDistortionRef,
    isReady,
    error,
  };
}
