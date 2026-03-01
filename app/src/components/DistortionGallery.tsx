import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { GalleryModal } from './GalleryModal';
import { GalleryHoverOverlay } from './GalleryHoverOverlay';
import { useInteractions } from '../hooks/useInteractions';
import type { GalleryItem } from '../types/gallery';

interface DistortionGalleryProps {
  items: GalleryItem[];
  onItemSelect?: (item: GalleryItem) => void;
}

// 闀滃ご鐣稿彉鐫€鑹插櫒
const DistortionShader = {
  uniforms: {
    'tDiffuse': { value: null },
    'distortion': { value: 0.0 }
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float distortion;
    varying vec2 vUv;

    void main() {
      vec2 center = vec2(0.5, 0.5);
      vec2 uv = vUv - center;
      float dist = length(uv);
      
      float distortionFactor = 1.0 + distortion * dist * dist * 2.5;
      vec2 distortedUv = center + uv * distortionFactor;
      
      vec3 color = texture2D(tDiffuse, distortedUv).rgb;
      
      float vignetteX = smoothstep(0.0, 0.18, vUv.x) * smoothstep(1.0, 0.82, vUv.x);
      float vignetteY = smoothstep(0.0, 0.18, vUv.y) * smoothstep(1.0, 0.82, vUv.y);
      float vignette = vignetteX * vignetteY;
      vignette = vignette * vignette;
      
      color *= vignette;
      
      gl_FragColor = vec4(color, 1.0);
    }
  `
};

export const DistortionGallery = ({ 
  items,
  onItemSelect,
}: DistortionGalleryProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.OrthographicCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const composerRef = useRef<EffectComposer | null>(null);
  const distortionPassRef = useRef<ShaderPass | null>(null);
  const gridGroupRef = useRef<THREE.Group | null>(null);
  const meshesRef = useRef<THREE.Mesh[]>([]);
  const raycasterRef = useRef<THREE.Raycaster>(new THREE.Raycaster());
  const animationIdRef = useRef<number | null>(null);
  
  // 使用交互Hook管理点赞和收藏
  const { toggleLike, toggleFavorite, isLiked, isFavorited } = useInteractions();
  
  // 浜や簰鐘舵€?
  const isDraggingRef = useRef(false);
  const dragStartPosRef = useRef({ x: 0, y: 0 });
  const hasMovedRef = useRef(false);
  const previousMouseRef = useRef({ x: 0, y: 0 });
  const velocityRef = useRef({ x: 0, y: 0 });
  const gridOffsetRef = useRef({ x: 0, y: 0 });
  const targetOffsetRef = useRef({ x: 0, y: 0 });
  const currentDistortionRef = useRef(0.0);
  const targetDistortionRef = useRef(0.0);
  const wheelTimeoutRef = useRef<number | null>(null);
  const hoveredMeshRef = useRef<THREE.Mesh | null>(null);
  
  // UI 鐘舵€?
  const [isLoading, setIsLoading] = useState(true);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [hoveredMeshBounds, setHoveredMeshBounds] = useState<{ left: number; top: number; width: number; height: number } | null>(null);
  const [selectedItem, setSelectedItem] = useState<GalleryItem | null>(null);
  const dragDirectionRef = useRef<'horizontal' | 'vertical' | null>(null);

  // 鐐硅禐澶勭悊
  const handleLike = (item: GalleryItem) => {
    // 使用assetId（字符串）或回退到id（数字转字符串）
    const assetId = item.assetId || item.id.toString();
    toggleLike(assetId);
  };

  // 鏀惰棌澶勭悊
  const handleBookmark = (item: GalleryItem) => {
    // 使用assetId（字符串）或回退到id（数字转字符串）
    const assetId = item.assetId || item.id.toString();
    toggleFavorite(assetId);
  };

  // 鐐瑰嚮澶勭悊
  const handleItemClick = (item: GalleryItem) => {
    setSelectedItem(item);
    onItemSelect?.(item);
  };

  // 鍏抽棴妯℃€佹
  const handleCloseModal = () => {
    setSelectedItem(null);
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 鍦烘櫙鍒濆鍖?
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);
    sceneRef.current = scene;

    // 鐩告満鍒濆鍖?
    const aspect = container.clientWidth / container.clientHeight;
    const camera = new THREE.OrthographicCamera(-aspect, aspect, 1, -1, 0.1, 100);
    camera.position.z = 1;
    cameraRef.current = camera;

    // 娓叉煋鍣ㄥ垵濮嬪寲
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 鍚庡鐞?
    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    const distortionPass = new ShaderPass(DistortionShader);
    composer.addPass(distortionPass);
    composerRef.current = composer;
    distortionPassRef.current = distortionPass;

    // 缃戞牸缁?
    const gridGroup = new THREE.Group();
    scene.add(gridGroup);
    gridGroupRef.current = gridGroup;

    // 鍔犺浇绾圭悊
    const textureLoader = new THREE.TextureLoader();
    const textures: THREE.Texture[] = [];
    let loadedCount = 0;

    const loadTextures = () => {
      items.forEach((item) => {
        textureLoader.load(
          item.image,
          (tex) => {
            tex.colorSpace = THREE.SRGBColorSpace;
            textures.push(tex);
            loadedCount++;
            if (loadedCount === items.length) {
              initGrid(textures);
            }
          },
          undefined,
          (err) => {
            console.error('鍔犺浇澶辫触:', item.image, err);
            loadedCount++;
            if (loadedCount === items.length) initGrid(textures);
          }
        );
      });
    };

    // 鍒濆鍖栫綉鏍?
    const initGrid = (textures: THREE.Texture[]) => {
      const aspect = container.clientWidth / container.clientHeight;
      const viewportWidth = aspect * 2;
      const gridWidth = viewportWidth * 1.2;
      
      const COLS = 6;
      const ROWS_VISIBLE = 8;
      const PANEL_WIDTH = gridWidth / COLS;
      const PANEL_HEIGHT = PANEL_WIDTH;
      const GAP = PANEL_WIDTH * 0.04;
      
      const actualGridWidth = COLS * PANEL_WIDTH + (COLS - 1) * GAP;
      const actualGridHeight = ROWS_VISIBLE * PANEL_HEIGHT + (ROWS_VISIBLE - 1) * GAP;
      
      const startX = -actualGridWidth / 2 + PANEL_WIDTH / 2;
      const startY = actualGridHeight / 2 - PANEL_HEIGHT / 2;
      
      const TOTAL_ROWS = 100;
      const TOTAL_COLS = 100;

      for (let row = 0; row < TOTAL_ROWS; row++) {
        for (let col = 0; col < TOTAL_COLS; col++) {
          const geometry = new THREE.PlaneGeometry(PANEL_WIDTH, PANEL_HEIGHT);
          const itemIndex = (row * COLS + (col % COLS)) % items.length;
          const texIndex = (row * COLS + (col % COLS)) % textures.length;
          
          // 浣跨敤鑷畾涔夌潃鑹插櫒鏉愯川瀹炵幇鍦嗚鍜屾偓鍋滅缉鏀?
          const material = new THREE.ShaderMaterial({
            uniforms: {
              map: { value: textures[texIndex] || null },
              opacity: { value: 1.0 },
              radius: { value: 0.05 },
              scale: { value: 1.0 } // 鍥剧墖缂╂斁姣斾緥
            },
            vertexShader: `
              varying vec2 vUv;
              void main() {
                vUv = uv;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
              }
            `,
            fragmentShader: `
              uniform sampler2D map;
              uniform float opacity;
              uniform float radius;
              uniform float scale;
              varying vec2 vUv;
              
              void main() {
                // 搴旂敤缂╂斁鏁堟灉 - 浠庝腑蹇冪缉鏀?
                vec2 center = vec2(0.5, 0.5);
                vec2 uv = center + (vUv - center) / scale;
                
                // 濡傛灉 UV 瓒呭嚭鑼冨洿锛屼娇鐢ㄨ竟缂橀鑹?
                if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
                  uv = clamp(uv, 0.0, 1.0);
                }
                
                vec4 texColor = texture2D(map, uv);
                
                // 璁＄畻鍦嗚
                vec2 pos = abs(vUv - 0.5) * 2.0;
                vec2 corner = max(pos - (1.0 - radius * 2.0), 0.0);
                float dist = length(corner);
                float alpha = 1.0 - smoothstep(radius - 0.01, radius, dist);
                
                gl_FragColor = vec4(texColor.rgb, texColor.a * alpha * opacity);
              }
            `,
            transparent: true,
            side: THREE.DoubleSide
          });
          
          const mesh = new THREE.Mesh(geometry, material);
          const x = startX + col * (PANEL_WIDTH + GAP);
          const y = startY - row * (PANEL_HEIGHT + GAP);
          
          mesh.position.set(x, y, 0);
          mesh.userData = { row, col, initialY: y, initialX: x, itemIndex };
          
          meshesRef.current.push(mesh);
          gridGroup.add(mesh);
        }
      }
      
      setIsLoading(false);
      animate();
    };

    // 鍔ㄧ敾寰幆
    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate);
      
      // 鎯€?
      if (!isDraggingRef.current) {
        targetOffsetRef.current.x += velocityRef.current.x;
        targetOffsetRef.current.y += velocityRef.current.y;
        velocityRef.current.x *= 0.95;
        velocityRef.current.y *= 0.95;
        
        if (!wheelTimeoutRef.current) {
          const speed = Math.sqrt(
            velocityRef.current.x * velocityRef.current.x + 
            velocityRef.current.y * velocityRef.current.y
          );
          if (speed > 0.001) {
            targetDistortionRef.current = Math.min(speed * 6, 0.5);
          } else {
            targetDistortionRef.current = 0.0;
          }
        }
      }
      
      // 骞虫粦鎻掑€?
      gridOffsetRef.current.x += (targetOffsetRef.current.x - gridOffsetRef.current.x) * 0.15;
      gridOffsetRef.current.y += (targetOffsetRef.current.y - gridOffsetRef.current.y) * 0.15;
      
      // 鐣稿彉骞虫粦杩囨浮
      currentDistortionRef.current += (targetDistortionRef.current - currentDistortionRef.current) * 0.1;
      if (distortionPassRef.current) {
        distortionPassRef.current.uniforms.distortion.value = currentDistortionRef.current;
      }
      
      // 搴旂敤浣嶇疆
      if (gridGroupRef.current) {
        gridGroupRef.current.position.x = gridOffsetRef.current.x;
        gridGroupRef.current.position.y = gridOffsetRef.current.y;
      }
      
      // 骞虫粦鏇存柊鎵€鏈夌綉鏍肩殑閫忔槑搴﹀拰缂╂斁
      meshesRef.current.forEach(mesh => {
        const mat = mesh.material as THREE.ShaderMaterial;
        const targetOpacity = mesh.userData.targetOpacity ?? 1.0;
        const targetScale = mesh.userData.targetScale ?? 1.0;
        
        // 浣跨敤 lerp 杩涜骞虫粦杩囨浮锛岄€熷害涓?0.15 (绫讳技 ease-out)
        const currentOpacity = mat.uniforms.opacity.value;
        const currentScale = mat.uniforms.scale.value;
        
        mat.uniforms.opacity.value += (targetOpacity - currentOpacity) * 0.15;
        mat.uniforms.scale.value += (targetScale - currentScale) * 0.15;
      });
      
      // 鏇存柊鎮仠缃戞牸鐨勫睆骞曚綅缃紙浠呭湪闈炴嫋鎷藉拰闈炴粴杞姸鎬侊級
      if (hoveredMeshRef.current && camera && !isDraggingRef.current && !wheelTimeoutRef.current) {
        updateHoveredMeshBounds(hoveredMeshRef.current, camera, container);
      }
      
      // 娓叉煋
      if (composerRef.current) {
        composerRef.current.render();
      }
    };

    // 鏇存柊鎮仠缃戞牸杈圭晫鐨勮緟鍔╁嚱鏁?
    const updateHoveredMeshBounds = (mesh: THREE.Mesh, camera: THREE.OrthographicCamera, container: HTMLDivElement) => {
      const rect = container.getBoundingClientRect();
      
      // 鑾峰彇缃戞牸鐨勪笘鐣屽潗鏍?
      const meshWorldPos = new THREE.Vector3();
      mesh.getWorldPosition(meshWorldPos);
      
      // 鑾峰彇缃戞牸鐨勫昂瀵?
      const geometry = mesh.geometry as THREE.PlaneGeometry;
      const width = geometry.parameters.width;
      const height = geometry.parameters.height;
      
      // 璁＄畻鍥涗釜瑙掔殑灞忓箷鍧愭爣
      const topLeft = new THREE.Vector3(
        meshWorldPos.x - width / 2,
        meshWorldPos.y + height / 2,
        meshWorldPos.z
      );
      const bottomRight = new THREE.Vector3(
        meshWorldPos.x + width / 2,
        meshWorldPos.y - height / 2,
        meshWorldPos.z
      );
      
      topLeft.project(camera);
      bottomRight.project(camera);
      
      const screenLeft = (topLeft.x * 0.5 + 0.5) * rect.width + rect.left;
      const screenTop = (topLeft.y * -0.5 + 0.5) * rect.height + rect.top;
      const screenRight = (bottomRight.x * 0.5 + 0.5) * rect.width + rect.left;
      const screenBottom = (bottomRight.y * -0.5 + 0.5) * rect.height + rect.top;
      
      setHoveredMeshBounds({
        left: screenLeft,
        top: screenTop,
        width: screenRight - screenLeft,
        height: screenBottom - screenTop,
      });
    };

    // 鎮仠妫€娴嬶紙鑺傛祦锛?
    let hoverCheckTimeout: number | null = null;
    const checkHover = (e: PointerEvent) => {
      // 鎷栨嫿銆佹粴杞垨妯℃€佹鎵撳紑鏃朵笉妫€娴嬫偓鍋?
      if (isDraggingRef.current || wheelTimeoutRef.current || !camera || selectedItem) return;
      
      if (hoverCheckTimeout) return;
      
      hoverCheckTimeout = window.setTimeout(() => {
        // 鍐嶆妫€鏌ョ姸鎬侊紝闃叉鍦?timeout 鏈熼棿鐘舵€佹敼鍙?
        if (isDraggingRef.current || wheelTimeoutRef.current || selectedItem) {
          hoverCheckTimeout = null;
          return;
        }
        
        const rect = container.getBoundingClientRect();
        const mouse = new THREE.Vector2(
          ((e.clientX - rect.left) / rect.width) * 2 - 1,
          -((e.clientY - rect.top) / rect.height) * 2 + 1
        );

        raycasterRef.current.setFromCamera(mouse, camera);
        const intersects = raycasterRef.current.intersectObjects(meshesRef.current);

        if (intersects.length > 0) {
          const itemIndex = intersects[0].object.userData.itemIndex;
          const mesh = intersects[0].object as THREE.Mesh;
          
          setHoveredIndex(itemIndex);
          hoveredMeshRef.current = mesh;
          container.style.cursor = 'pointer';
          
          // 绔嬪嵆鏇存柊涓€娆′綅缃?
          updateHoveredMeshBounds(mesh, camera, container);
          
          // 楂樹寒鎮仠鐨勭綉鏍?- 浣跨敤骞虫粦杩囨浮
          meshesRef.current.forEach((m) => {
            if (m.userData.itemIndex === itemIndex) {
              // 瀛樺偍鐩爣鍊?
              m.userData.targetOpacity = 0.7;
              m.userData.targetScale = 1.1;
            } else {
              m.userData.targetOpacity = 1.0;
              m.userData.targetScale = 1.0;
            }
          });
        } else {
          setHoveredIndex(null);
          hoveredMeshRef.current = null;
          setHoveredMeshBounds(null);
          container.style.cursor = 'grab';
          
          // 鎭㈠鎵€鏈夌綉鏍?- 璁剧疆鐩爣鍊?
          meshesRef.current.forEach(mesh => {
            mesh.userData.targetOpacity = 1.0;
            mesh.userData.targetScale = 1.0;
          });
        }
        
        hoverCheckTimeout = null;
      }, 16); // ~60fps
    };

    // 浜嬩欢澶勭悊
    const onPointerDown = (e: PointerEvent) => {
      isDraggingRef.current = true;
      hasMovedRef.current = false;
      dragDirectionRef.current = null;
      dragStartPosRef.current = { x: e.clientX, y: e.clientY };
      previousMouseRef.current = { x: e.clientX, y: e.clientY };
      velocityRef.current = { x: 0, y: 0 };
      container.style.cursor = 'grabbing';
      
      // 鎷栨嫿鏃舵竻闄ゆ偓鍋滅姸鎬?
      setHoveredIndex(null);
      hoveredMeshRef.current = null;
      setHoveredMeshBounds(null);
      
      // 鎭㈠鎵€鏈夌綉鏍奸€忔槑搴﹀拰缂╂斁 - 璁剧疆鐩爣鍊?
      meshesRef.current.forEach(mesh => {
        mesh.userData.targetOpacity = 1.0;
        mesh.userData.targetScale = 1.0;
      });
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!isDraggingRef.current) {
        checkHover(e);
        return;
      }
      
      // 妫€娴嬫槸鍚︾Щ鍔ㄨ秴杩囬槇鍊?
      const moveDistance = Math.sqrt(
        Math.pow(e.clientX - dragStartPosRef.current.x, 2) +
        Math.pow(e.clientY - dragStartPosRef.current.y, 2)
      );
      if (moveDistance > 5) {
        hasMovedRef.current = true;
        
        // 纭畾鎷栨嫿鏂瑰悜锛堝彧鍦ㄧ涓€娆＄‘瀹氾級
        if (!dragDirectionRef.current) {
          const deltaX = Math.abs(e.clientX - dragStartPosRef.current.x);
          const deltaY = Math.abs(e.clientY - dragStartPosRef.current.y);
          dragDirectionRef.current = deltaX > deltaY ? 'horizontal' : 'vertical';
        }
      }
      
      const deltaX = (e.clientX - previousMouseRef.current.x) / window.innerWidth;
      const deltaY = (e.clientY - previousMouseRef.current.y) / window.innerHeight;

      // 鏍规嵁鎷栨嫿鏂瑰悜搴旂敤涓嶅悓鐨勭Щ鍔?
      if (dragDirectionRef.current === 'vertical') {
        // 涓婁笅婊戝姩锛氭祻瑙堝綋鍓嶇敤鎴风殑鍥剧墖
        targetOffsetRef.current.y += deltaY * 2;
        velocityRef.current.y = deltaY * 2;
      } else if (dragDirectionRef.current === 'horizontal') {
        // 宸﹀彸婊戝姩锛氬垏鎹㈢敤鎴?
        targetOffsetRef.current.x += deltaX * 2;
        velocityRef.current.x = deltaX * 2;
      }
      
      const speed = Math.sqrt(
        velocityRef.current.x * velocityRef.current.x + 
        velocityRef.current.y * velocityRef.current.y
      );
      targetDistortionRef.current = Math.min(speed * 10, 0.5);

      previousMouseRef.current = { x: e.clientX, y: e.clientY };
    };

    const onPointerUp = (e: PointerEvent) => {
      const wasDragging = isDraggingRef.current;
      isDraggingRef.current = false;
      container.style.cursor = 'grab';
      targetDistortionRef.current = 0.0;
      
      // 妫€娴嬪乏鍙虫粦鍔ㄥ垏鎹㈢敤鎴?
      if (wasDragging && dragDirectionRef.current === 'horizontal' && hasMovedRef.current) {
        const deltaX = e.clientX - dragStartPosRef.current.x;
        const threshold = window.innerWidth * 0.2; // 20% 灞忓箷瀹藉害
        
        if (Math.abs(deltaX) > threshold) {
          if (deltaX > 0) {
            // 鍚戝彸婊戝姩 - 涓婁竴涓敤鎴?
            // User index removed
          } else {
            // 鍚戝乏婊戝姩 - 涓嬩竴涓敤鎴?
            // User index removed
          }
        }
      }
      
      // 鍙湁鍦ㄦ病鏈夋嫋鎷界Щ鍔ㄦ椂鎵嶈Е鍙戠偣鍑?
      if (wasDragging && !hasMovedRef.current && camera) {
        const rect = container.getBoundingClientRect();
        const mouse = new THREE.Vector2(
          ((e.clientX - rect.left) / rect.width) * 2 - 1,
          -((e.clientY - rect.top) / rect.height) * 2 + 1
        );

        raycasterRef.current.setFromCamera(mouse, camera);
        const intersects = raycasterRef.current.intersectObjects(meshesRef.current);

        if (intersects.length > 0) {
          const itemIndex = intersects[0].object.userData.itemIndex;
          handleItemClick(items[itemIndex]);
        }
      }
      
      hasMovedRef.current = false;
      dragDirectionRef.current = null;
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      targetOffsetRef.current.y += e.deltaY * 0.001;
      
      const wheelSpeed = Math.abs(e.deltaY) * 0.003;
      targetDistortionRef.current = Math.min(wheelSpeed, 0.5);
      
      // 婊氳疆鏃堕殣钘忔偓鍋滆鐩栧眰
      setHoveredIndex(null);
      hoveredMeshRef.current = null;
      setHoveredMeshBounds(null);
      
      // 鎭㈠鎵€鏈夌綉鏍奸€忔槑搴﹀拰缂╂斁 - 璁剧疆鐩爣鍊?
      meshesRef.current.forEach(mesh => {
        mesh.userData.targetOpacity = 1.0;
        mesh.userData.targetScale = 1.0;
      });
      
      if (wheelTimeoutRef.current) clearTimeout(wheelTimeoutRef.current);
      
      wheelTimeoutRef.current = window.setTimeout(() => {
        targetDistortionRef.current = 0.0;
        wheelTimeoutRef.current = null;
      }, 500);
    };

    const handleResize = () => {
      const width = container.clientWidth;
      const height = container.clientHeight;
      const aspect = width / height;
      
      if (cameraRef.current) {
        cameraRef.current.left = -aspect;
        cameraRef.current.right = aspect;
        cameraRef.current.updateProjectionMatrix();
      }
      
      if (rendererRef.current) {
        rendererRef.current.setSize(width, height);
      }
      
      if (composerRef.current) {
        composerRef.current.setSize(width, height);
      }
    };

    container.addEventListener('pointerdown', onPointerDown);
    container.addEventListener('pointermove', onPointerMove);
    container.addEventListener('pointerup', onPointerUp);
    container.addEventListener('pointerleave', onPointerUp);
    container.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('resize', handleResize);

    container.style.cursor = 'grab';
    loadTextures();

    // 娓呯悊
    return () => {
      container.removeEventListener('pointerdown', onPointerDown);
      container.removeEventListener('pointermove', onPointerMove);
      container.removeEventListener('pointerup', onPointerUp);
      container.removeEventListener('pointerleave', onPointerUp);
      container.removeEventListener('wheel', onWheel);
      window.removeEventListener('resize', handleResize);
      
      if (hoverCheckTimeout) clearTimeout(hoverCheckTimeout);
      
      if (animationIdRef.current !== null) {
        cancelAnimationFrame(animationIdRef.current);
      }
      
      meshesRef.current.forEach(mesh => {
        mesh.geometry.dispose();
        if (mesh.material instanceof THREE.Material) {
          mesh.material.dispose();
        }
      });
      
      if (gridGroupRef.current) {
        gridGroupRef.current.clear();
      }
      
      if (sceneRef.current) {
        sceneRef.current.clear();
      }
      
      if (rendererRef.current) {
        rendererRef.current.dispose();
        if (container.contains(rendererRef.current.domElement)) {
          container.removeChild(rendererRef.current.domElement);
        }
      }
      
      if (composerRef.current) {
        composerRef.current.dispose();
      }
    };
  }, [items, selectedItem]);

  const hoveredItem = hoveredIndex !== null ? items[hoveredIndex] : null;

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className="w-full h-full" />
      
      {/* 鍔犺浇鐘舵€?*/}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black">
          <div className="text-white text-lg">鍔犺浇涓?..</div>
        </div>
      )}
      
      {/* 鎮仠瑕嗙洊灞?- 鏄剧ず鍦ㄥ浘鐗囧簳閮ㄥ彸涓嬭锛屽甫钂欏眰 */}
      {hoveredItem && !selectedItem && (
        <GalleryHoverOverlay
          isVisible={true}
          isLiked={isLiked(hoveredItem.assetId || hoveredItem.id.toString())}
          isBookmarked={isFavorited(hoveredItem.assetId || hoveredItem.id.toString())}
          onLike={() => handleLike(hoveredItem)}
          onBookmark={() => handleBookmark(hoveredItem)}
          meshBounds={hoveredMeshBounds}
        />
      )}
      
      {/* 璇︽儏妯℃€佹 - 鍙樉绀哄師鍥?*/}
      <GalleryModal
        item={selectedItem}
        onClose={handleCloseModal}
      />
      
    </div>
  );
};
 