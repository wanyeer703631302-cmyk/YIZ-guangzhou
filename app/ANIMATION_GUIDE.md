# 动效优化指南

## 实现的动效优化

### 1. 鼠标悬停按钮 ✅

**位置**: 右上角点赞/收藏按钮

**动效**:
- 出现/消失: Spring动效
  - `stiffness: 400` (高弹性)
  - `damping: 25` (适中阻尼)
- Hover: `scale: 1.1`
- Tap: `scale: 0.95`
- 按钮尺寸: 12x12 (更大更易点击)

**触发条件**:
- 只在悬停图片且未打开弹窗时显示
- 拖拽时自动隐藏

### 2. 图片放大弹窗 ✅

**布局**: 只显示原尺寸图片

**动效**:
- 背景遮罩: 
  - `duration: 0.3s`
  - `ease: [0.4, 0, 0.2, 1]` (cubic-bezier缓动)
  
- 图片容器:
  - `type: 'spring'`
  - `stiffness: 300`
  - `damping: 30`
  
- 图片淡入:
  - `duration: 0.4s`
  - `ease: [0.4, 0, 0.2, 1]`

- 关闭按钮:
  - Hover: `scale: 1.1` + `rotate: 90deg`
  - Tap: `scale: 0.9`
  - Spring动效: `stiffness: 400, damping: 20`

- 底部按钮:
  - 延迟出现: `delay: 0.2s`
  - Spring动效: `stiffness: 300, damping: 25`

### 3. 底部用户栏 ✅

**布局**: 完全居中 (`left: 0, right: 0, justify-center`)

**动效**:
- 整体出现:
  - `duration: 0.6s`
  - `delay: 0.5s`
  - `ease: [0.4, 0, 0.2, 1]`

- 用户按钮:
  - Hover: `scale: 1.05`
  - Tap: `scale: 0.95`
  - Spring: `stiffness: 400, damping: 20`

- 头像放大:
  - 选中: `scale: 1.1`
  - Spring: `stiffness: 400, damping: 25`

- 名称展开:
  - 宽度: Spring动效 (`stiffness: 300, damping: 30`)
  - 透明度: Ease动效 (`duration: 0.2s`)

## 动效参数说明

### Spring (弹簧动效)
```typescript
{
  type: 'spring',
  stiffness: 300-400,  // 弹性强度 (越大越快)
  damping: 20-30       // 阻尼 (越大越少弹跳)
}
```

**使用场景**:
- 交互反馈 (按钮点击、hover)
- 元素进入/退出
- 尺寸变化

### Ease (缓动)
```typescript
{
  duration: 0.2-0.6,
  ease: [0.4, 0, 0.2, 1]  // cubic-bezier
}
```

**使用场景**:
- 透明度变化
- 背景遮罩
- 平滑过渡

## 视觉层次

1. **快速响应** (100-200ms)
   - 按钮hover/tap
   - 即时反馈

2. **标准动画** (300-400ms)
   - 弹窗打开/关闭
   - 元素进入/退出

3. **延迟动画** (500-600ms)
   - 页面加载动画
   - 次要元素出现

## 性能优化

- 使用 `transform` 和 `opacity` (GPU加速)
- 避免 `width/height` 动画 (使用scale代替)
- AnimatePresence 管理退出动画
- layoutId 实现共享元素过渡

## 测试要点

✅ 悬停图片显示按钮 (弹簧动效)
✅ 点击图片放大 (原尺寸显示)
✅ 关闭按钮旋转动效
✅ 底部用户栏完全居中
✅ 用户切换平滑展开
✅ 所有交互都有弹簧反馈
