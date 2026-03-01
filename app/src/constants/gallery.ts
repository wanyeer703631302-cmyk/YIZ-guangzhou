/**
 * 画廊配置常量
 */
export const GALLERY_CONFIG = {
  // 网格配置
  GRID: {
    COLS: 6,
    ROWS: 8,
    TOTAL_ROWS: 20,  // 减少到 20 行（从 100 减少）
    TOTAL_COLS: 20,  // 减少到 20 列（从 100 减少）
    GAP_RATIO: 0.04,
  },
  
  // 交互配置
  INTERACTION: {
    DRAG_THRESHOLD: 5,           // 拖拽检测阈值（像素）
    DRAG_SENSITIVITY: 2,         // 拖拽灵敏度
    FRICTION_COEFFICIENT: 0.95,  // 摩擦系数
    LERP_FACTOR: 0.15,          // 插值因子
    VELOCITY_THRESHOLD: 0.001,   // 速度阈值
    HOVER_THROTTLE_MS: 16,       // 悬停检测节流（毫秒）
    WHEEL_SPEED: 0.001,          // 滚轮速度
    WHEEL_DISTORTION_DURATION: 500, // 滚轮扭曲持续时间（毫秒）
    INERTIA_DAMPING: 0.95,       // 惯性衰减
    SMOOTH_FACTOR: 1.0,          // 平滑因子（1.0 = 无平滑，更快响应）
  },
  
  // 扭曲效果配置
  DISTORTION: {
    MAX_DISTORTION: 0.5,         // 最大扭曲值
    DISTORTION_FACTOR: 6,        // 扭曲系数
    DRAG_DISTORTION_FACTOR: 10,  // 拖拽扭曲系数
    WHEEL_DISTORTION_FACTOR: 0.003,
    WHEEL_TIMEOUT: 500,          // 滚轮扭曲超时（毫秒）
    SMOOTH_FACTOR: 1.0,          // 扭曲平滑因子（1.0 = 无平滑，更快响应）
  },
  
  // 渲染配置
  RENDERING: {
    MAX_PIXEL_RATIO: 2,          // 最大像素比
    TARGET_FPS: 60,              // 目标帧率
    BACKGROUND_COLOR: 0x000000,  // 背景色
  },
  
  // 纹理配置
  TEXTURE: {
    CORNER_RADIUS: 20,           // 圆角半径（像素）
    MAX_TEXTURE_SIZE: 1024,      // 最大纹理尺寸
    COLOR_SPACE: 'srgb' as const, // 色彩空间
  },
  
  // 动画配置
  ANIMATION: {
    MODAL_DURATION: 0.3,
    OVERLAY_DURATION: 0.2,
    SPRING_STIFFNESS: 300,
    SPRING_DAMPING: 30,
  },
} as const;

export type GalleryConfig = typeof GALLERY_CONFIG;
