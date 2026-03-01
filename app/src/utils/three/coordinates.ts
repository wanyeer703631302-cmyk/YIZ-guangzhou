import * as THREE from 'three';

/**
 * 将屏幕坐标转换为归一化设备坐标 (NDC)
 * @param clientX - 屏幕 X 坐标
 * @param clientY - 屏幕 Y 坐标
 * @param container - 容器元素
 * @returns NDC 坐标 (范围 [-1, 1])
 */
export function screenToNDC(
  clientX: number,
  clientY: number,
  container: HTMLElement
): THREE.Vector2 {
  const rect = container.getBoundingClientRect();
  const x = ((clientX - rect.left) / rect.width) * 2 - 1;
  const y = -((clientY - rect.top) / rect.height) * 2 + 1;
  return new THREE.Vector2(x, y);
}

/**
 * 将 NDC 坐标转换为屏幕坐标
 * @param ndcX - NDC X 坐标 (范围 [-1, 1])
 * @param ndcY - NDC Y 坐标 (范围 [-1, 1])
 * @param container - 容器元素
 * @returns 屏幕坐标
 */
export function ndcToScreen(
  ndcX: number,
  ndcY: number,
  container: HTMLElement
): { x: number; y: number } {
  const rect = container.getBoundingClientRect();
  const x = ((ndcX + 1) / 2) * rect.width + rect.left;
  const y = ((1 - ndcY) / 2) * rect.height + rect.top;
  return { x, y };
}
