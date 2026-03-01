import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';

/**
 * 画廊项目数据结构
 */
export interface GalleryItem {
  id: number;
  assetId?: string; // API资源ID（字符串格式）
  title: string;
  brand: string;
  category: string[];
  year: string;
  image: string;
  color?: string; // 可选的渐变色
}

/**
 * 画廊交互状态
 */
export interface GalleryInteractionState {
  hoveredIndex: number | null;
  selectedItem: GalleryItem | null;
  isDragging: boolean;
}

/**
 * 用户操作状态（点赞、收藏）
 */
export interface GalleryUserActions {
  likes: Set<number>;
  bookmarks: Set<number>;
}

/**
 * Three.js 场景引用
 */
export interface ThreeSceneRefs {
  scene: THREE.Scene;
  camera: THREE.OrthographicCamera;
  renderer: THREE.WebGLRenderer;
  composer: EffectComposer;
  meshes: THREE.Mesh[];
  raycaster: THREE.Raycaster;
  gridGroup: THREE.Group;
  distortionPass: any;
}

/**
 * 网格偏移量
 */
export interface GalleryOffset {
  x: number;
  y: number;
}

/**
 * 速度向量
 */
export interface GalleryVelocity {
  x: number;
  y: number;
}
