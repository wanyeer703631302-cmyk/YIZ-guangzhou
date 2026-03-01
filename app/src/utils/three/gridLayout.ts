import * as THREE from 'three';
import { GALLERY_CONFIG } from '../../constants/gallery';
import type { GalleryItem } from '../../types/gallery';

export interface GridConfig {
  cols: number;
  rows: number;
  panelSize: number;
  gap: number;
  aspect: number;
}

/**
 * 计算网格布局参数
 */
export function calculateGridLayout(aspect: number): GridConfig {
  const { COLS, ROWS, GAP_RATIO } = GALLERY_CONFIG.GRID;
  const viewportWidth = aspect * 2;
  const gridWidth = viewportWidth * 1.2;
  const panelSize = gridWidth / COLS;
  const gap = panelSize * GAP_RATIO;
  
  return {
    cols: COLS,
    rows: ROWS,
    panelSize,
    gap,
    aspect,
  };
}

/**
 * 生成网格索引
 * 确保所有索引在有效范围内
 */
export function generateGridIndices(
  itemCount: number,
  cols: number,
  totalRows: number
): number[] {
  const indices: number[] = [];
  
  for (let row = 0; row < totalRows; row++) {
    for (let col = 0; col < GALLERY_CONFIG.GRID.TOTAL_COLS; col++) {
      const itemIndex = (row * cols + (col % cols)) % itemCount;
      indices.push(itemIndex);
    }
  }
  
  return indices;
}

/**
 * 创建网格网格
 */
export function createGridMeshes(
  textures: THREE.Texture[],
  items: GalleryItem[],
  gridConfig: GridConfig,
  gridGroup: THREE.Group
): THREE.Mesh[] {
  const meshes: THREE.Mesh[] = [];
  const { cols, panelSize, gap } = gridConfig;
  const { TOTAL_ROWS, TOTAL_COLS } = GALLERY_CONFIG.GRID;
  
  // 计算布局参数
  const actualWidth = cols * panelSize + (cols - 1) * gap;
  const actualHeight = GALLERY_CONFIG.GRID.ROWS * panelSize + (GALLERY_CONFIG.GRID.ROWS - 1) * gap;
  const startX = -actualWidth / 2 + panelSize / 2;
  const startY = actualHeight / 2 - panelSize / 2;

  for (let row = 0; row < TOTAL_ROWS; row++) {
    for (let col = 0; col < TOTAL_COLS; col++) {
      const geometry = new THREE.PlaneGeometry(panelSize, panelSize);
      const itemIndex = (row * cols + (col % cols)) % items.length;
      const texIndex = (row * cols + (col % cols)) % textures.length;
      const texture = textures[texIndex];
      
      const material = texture 
        ? new THREE.MeshBasicMaterial({ map: texture })
        : new THREE.MeshBasicMaterial({ color: 0x333333 });
        
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(
        startX + col * (panelSize + gap),
        startY - row * (panelSize + gap),
        0
      );
      mesh.userData = { itemIndex };
      gridGroup.add(mesh);
      meshes.push(mesh);
    }
  }
  
  return meshes;
}
