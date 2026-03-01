# 畸变画廊集成指南

## 1. 安装依赖

在 `app` 目录下运行：

```bash
cd app
npm install three @types/three
```

## 2. 使用 DistortionGallery 组件

已创建 `src/components/DistortionGallery.tsx` 组件，包含完整的Three.js畸变滚动效果。

### 在 App.tsx 中集成

替换当前的图片展示部分，有两种方式：

### 方式1：完全替换（推荐）

将 `App.tsx` 中的 Gallery Grid 部分替换为：

```tsx
import { DistortionGallery } from './components/DistortionGallery';

// 在 App 组件中
const galleryImages = galleryData.map(item => item.image);

// 替换 Gallery Grid section
<section className="h-screen" id="work">
  <DistortionGallery images={galleryImages} />
</section>
```

### 方式2：作为独立页面

创建一个新的路由或页面来展示畸变画廊。

## 3. 功能特性

- ✅ 静止时显示为平面网格
- ✅ 拖拽滚动时产生动态畸变效果
- ✅ 滚轮滚动触发畸变
- ✅ 上下左右无限循环滚动
- ✅ 6列8行网格布局
- ✅ 边缘渐变遮罩，隐藏拉伸效果
- ✅ 响应式设计，自适应窗口大小

## 4. 自定义配置

在 `DistortionGallery.tsx` 中可以调整：

- `COLS = 6` - 列数
- `ROWS_VISIBLE = 8` - 可见行数
- `maxDistortion = 0.5` - 最大畸变强度
- `wheelSpeed * 0.003` - 滚轮畸变系数
- `GAP = PANEL_WIDTH * 0.04` - 图片间隙

## 5. 图片要求

- 支持任何图片URL
- 建议使用相同宽高比的图片
- 图片会自动保持正方形显示

## 6. 性能优化

- 使用 `requestAnimationFrame` 进行动画
- 组件卸载时自动清理资源
- 支持设备像素比优化

## 7. 启动开发服务器

```bash
cd app
npm run dev
```

访问 http://localhost:5173 查看效果。
