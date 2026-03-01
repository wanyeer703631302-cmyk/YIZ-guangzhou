# 实施任务：画廊优化 (Gallery Optimization)

## 概述

本任务列表基于 14 周分阶段实施计划，将 DistortionGallery 组件（约 500 行）重构为模块化、可维护的架构。重构包括组件拆分、hooks 提取、性能优化、可访问性增强和完整的测试策略。

## 任务列表

### 阶段 1：提取状态管理和图片加载 Hooks（第 1-2 周）

- [x] 1. 创建类型定义和常量配置
  - [x] 1.1 创建 types/gallery.ts 定义核心类型
    - 定义 GalleryItem、GalleryInteractionState、GalleryUserActions 等接口
    - 定义 ThreeSceneRefs、GalleryOffset、GalleryVelocity 等类型
    - _需求: 1.1, 12.4_
  
  - [x] 1.2 创建 constants/gallery.ts 配置文件
    - 定义网格配置（GRID）
    - 定义交互配置（INTERACTION）
    - 定义扭曲效果配置（DISTORTION）
    - 定义渲染配置（RENDERING）
    - 定义纹理配置（TEXTURE）
    - 定义动画配置（ANIMATION）
    - _需求: 12.6_

- [x] 2. 实现 useGalleryState Hook
  - [x] 2.1 创建 hooks/useGalleryState.ts
    - 实现悬停项索引状态管理
    - 实现选中项状态管理
    - 实现点赞状态管理（使用 Set）
    - 实现收藏状态管理（使用 Set）
    - 实现状态切换方法（toggleLike、toggleBookmark）
    - 实现状态查询方法（isLiked、isBookmarked）
    - 确保状态更新是不可变的（返回新的 Set 实例）
    - _需求: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8_
  
  - [ ]* 2.2 编写 useGalleryState 单元测试
    - 测试状态初始化
    - 测试 toggleLike 和 toggleBookmark 功能
    - 测试回调函数调用
    - 测试状态查询方法
    - _需求: 11.1_
  
  - [ ]* 2.3 编写 useGalleryState 属性测试
    - **属性 1: 状态不可变性** - 验证状态操作返回新实例
    - **验证需求: 5.5, 5.6**
    - **属性 8: 点赞/收藏幂等性** - 验证偶数次切换恢复初始值
    - **验证需求: 5.5, 5.6**
    - _需求: 11.3_


- [x] 3. 实现 useImageLoader Hook
  - [x] 3.1 创建 hooks/useImageLoader.ts
    - 实现并行图片加载逻辑
    - 实现圆角处理（20px 圆角半径）
    - 创建 Three.js 纹理对象
    - 设置纹理色彩空间为 SRGB
    - 实现加载进度跟踪
    - 实现错误处理（加载失败返回 null）
    - 实现纹理压缩（超过 1024px）
    - _需求: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8, 6.9_
  
  - [ ]* 3.2 编写 useImageLoader 单元测试
    - 测试图片加载成功场景
    - 测试图片加载失败场景
    - 测试圆角处理
    - 测试纹理压缩
    - 测试进度回调
    - _需求: 11.1_
  
  - [ ]* 3.3 编写 useImageLoader 属性测试
    - **属性 7: 加载进度单调性** - 验证加载数量单调递增
    - **验证需求: 6.1, 6.5**
    - **属性 11: 圆角处理一致性** - 验证圆角半径正确应用
    - **验证需求: 6.2**
    - **属性 12: 纹理色彩空间** - 验证色彩空间为 SRGB
    - **验证需求: 6.4**
    - _需求: 11.3_

- [x] 4. 集成 hooks 到现有组件
  - [x] 4.1 在 DistortionGallery 中集成 useGalleryState
    - 替换现有状态管理逻辑
    - 连接回调函数
    - _需求: 2.3_
  
  - [x] 4.2 在 DistortionGallery 中集成 useImageLoader
    - 替换现有图片加载逻辑
    - 处理加载状态和错误
    - _需求: 2.4_

- [ ] 5. 检查点 - 确保所有测试通过
  - 确保所有测试通过，询问用户是否有问题

### 阶段 2：提取 Three.js 场景管理（第 3-4 周）

- [x] 6. 提取 Three.js 工具函数
  - [x] 6.1 创建 utils/three/coordinates.ts
    - 实现 NDC 坐标转换函数
    - _需求: 4.6_
  
  - [x] 6.2 创建 utils/three/shaders.ts
    - 提取扭曲效果着色器定义
    - _需求: 3.2_
  
  - [x] 6.3 创建 utils/three/gridLayout.ts
    - 实现网格布局计算函数
    - 实现网格索引生成函数
    - _需求: 3.3_
  
  - [ ]* 6.4 编写 gridLayout 属性测试
    - **属性 4: 纹理索引有效性** - 验证所有索引在有效范围内
    - **验证需求: 3.3**
    - _需求: 11.3_

- [x] 7. 实现 useThreeScene Hook
  - [x] 7.1 创建 hooks/useThreeScene.ts（场景初始化）
    - 实现场景、相机、渲染器初始化
    - 实现后处理管线创建（扭曲效果）
    - 实现窗口大小调整处理
    - _需求: 3.1, 3.2, 3.5_
  
  - [x] 7.2 在 useThreeScene 中实现网格创建
    - 集成 useImageLoader 加载纹理
    - 使用 gridLayout 工具创建网格
    - 添加网格到场景
    - _需求: 3.3_
  
  - [x] 7.3 在 useThreeScene 中实现渲染循环
    - 实现 requestAnimationFrame 循环
    - 应用惯性衰减和平滑插值
    - 更新扭曲效果和网格位置
    - 限制帧率为 60fps
    - _需求: 3.4, 7.5_
  
  - [x] 7.4 在 useThreeScene 中实现资源清理
    - 清理几何体、材质、纹理
    - 清理渲染器和后处理管线
    - 移除事件监听器
    - _需求: 3.6, 7.9_
  
  - [ ]* 7.5 编写 useThreeScene 单元测试
    - 测试场景初始化
    - 测试资源清理
    - 测试错误处理（WebGL 不支持）
    - _需求: 11.1_
  
  - [ ]* 7.6 编写 useThreeScene 集成测试
    - 测试完整的场景初始化和纹理加载流程
    - _需求: 11.4_
  
  - [ ]* 7.7 编写 useThreeScene 属性测试
    - **属性 2: 事件监听器清理** - 验证卸载时清理所有监听器
    - **验证需求: 3.6, 7.9**
    - **属性 6: 渲染循环连续性** - 验证帧 ID 和时间戳递增
    - **验证需求: 3.4**
    - _需求: 11.3_

- [x] 8. 集成 useThreeScene 到组件
  - [x] 8.1 在 DistortionGallery 中集成 useThreeScene
    - 替换现有 Three.js 初始化逻辑
    - 处理加载状态和错误
    - _需求: 2.2_

- [ ] 9. 检查点 - 确保所有测试通过
  - 确保所有测试通过，询问用户是否有问题

### 阶段 3：提取交互逻辑（第 5-6 周）

- [x] 10. 创建性能优化工具
  - [x] 10.1 创建 utils/performance/throttle.ts
    - 实现节流函数
    - _需求: 7.8_
  
  - [x] 10.2 创建 utils/performance/debounce.ts
    - 实现防抖函数
    - _需求: 7.8_

- [x] 11. 实现 useGalleryInteraction Hook
  - [x] 11.1 创建 hooks/useGalleryInteraction.ts（拖拽逻辑）
    - 实现 pointerdown 事件处理
    - 实现 pointermove 拖拽逻辑
    - 实现 pointerup 事件处理
    - 实现拖拽距离检测（5px 阈值）
    - 计算速度和更新网格偏移量
    - _需求: 4.1, 4.2, 4.3, 4.4, 4.5_
  
  - [x] 11.2 在 useGalleryInteraction 中实现悬停检测
    - 实现射线检测逻辑
    - 使用节流优化悬停检测（16ms）
    - 更新光标样式
    - 触发 onHoverChange 回调
    - _需求: 4.6, 7.8_
  
  - [x] 11.3 在 useGalleryInteraction 中实现滚轮处理
    - 实现 wheel 事件处理
    - 调整网格偏移量
    - _需求: 4.7_
  
  - [x] 11.4 在 useGalleryInteraction 中实现扭曲效果
    - 根据速度动态调整扭曲强度
    - 平滑恢复扭曲效果到 0
    - _需求: 4.8, 4.9_
  
  - [ ]* 11.5 编写 useGalleryInteraction 单元测试
    - 测试拖拽逻辑
    - 测试悬停检测
    - 测试滚轮处理
    - 测试扭曲效果计算
    - _需求: 11.1_
  
  - [ ]* 11.6 编写 useGalleryInteraction 属性测试
    - **属性 3: 拖拽与点击互斥** - 验证拖拽时不触发点击
    - **验证需求: 4.4, 4.5**
    - **属性 5: 悬停状态一致性** - 验证悬停索引有效性
    - **验证需求: 4.6**
    - **属性 9: 网格位置平滑性** - 验证偏移量差值递减
    - **验证需求: 4.2, 4.3**
    - **属性 10: 扭曲效果边界** - 验证扭曲值在 0 到 MAX_DISTORTION 之间
    - **验证需求: 4.8, 4.9**
    - **属性 14: 拖拽速度更新** - 验证速度根据移动距离更新
    - **验证需求: 4.2**
    - **属性 15: 滚轮偏移调整** - 验证滚轮事件调整偏移量
    - **验证需求: 4.7**
    - **属性 16: 速度扭曲关联** - 验证扭曲强度与速度正相关
    - **验证需求: 4.8**
    - _需求: 11.3_

- [x] 12. 集成 useGalleryInteraction 到组件
  - [x] 12.1 在 DistortionGallery 中集成 useGalleryInteraction
    - 替换现有交互逻辑
    - 连接事件回调
    - _需求: 2.2_

- [ ] 13. 检查点 - 确保所有测试通过
  - 确保所有测试通过，询问用户是否有问题


### 阶段 4：拆分 UI 组件（第 7-8 周）

- [x] 14. 创建可复用的 ActionButtons 组件
  - [x] 14.1 创建 components/ActionButtons/ActionButtons.tsx
    - 实现点赞按钮（Heart 图标）
    - 实现收藏按钮（Bookmark 图标）
    - 支持 overlay 和 modal 两种变体
    - 添加 ARIA 属性（aria-label、aria-pressed）
    - 添加 role="group" 和 aria-label
    - _需求: 1.5, 8.3, 8.4, 8.5_
  
  - [ ]* 14.2 编写 ActionButtons 单元测试
    - 测试按钮渲染
    - 测试点击事件
    - 测试状态显示（已点赞/未点赞）
    - 测试 ARIA 属性
    - _需求: 11.2_
  
  - [ ]* 14.3 编写 ActionButtons 属性测试
    - **属性 17: ARIA 状态同步** - 验证 aria-pressed 与状态同步
    - **验证需求: 8.4**
    - _需求: 11.3_

- [x] 15. 创建 LoadingState 组件
  - [x] 15.1 创建 components/LoadingState/LoadingState.tsx
    - 显示加载进度
    - 显示加载动画
    - 添加 aria-live 区域
    - _需求: 1.6, 8.12_
  
  - [ ]* 15.2 编写 LoadingState 单元测试
    - 测试组件渲染
    - 测试进度显示
    - _需求: 11.2_

- [x] 16. 创建 GalleryOverlay 组件
  - [x] 16.1 创建 components/GalleryOverlay/GalleryOverlay.tsx
    - 显示悬停项信息（标题、品牌）
    - 集成 ActionButtons 组件
    - 添加淡入淡出动画
    - 尊重 prefers-reduced-motion 设置
    - _需求: 1.3, 8.14_
  
  - [ ]* 16.2 编写 GalleryOverlay 单元测试
    - 测试组件渲染
    - 测试悬停项信息显示
    - 测试按钮交互
    - _需求: 11.2_

- [x] 17. 创建 GalleryModal 组件
  - [x] 17.1 创建 components/GalleryModal/ImageViewer.tsx
    - 显示大图
    - 添加图片 alt 属性
    - _需求: 1.7_
  
  - [x] 17.2 创建 components/GalleryModal/GalleryModal.tsx
    - 使用 role="dialog" 和 aria-modal="true"
    - 使用 aria-labelledby 和 aria-describedby
    - 集成 ImageViewer 组件
    - 集成 ActionButtons 组件
    - 实现关闭按钮
    - 实现焦点管理（打开时聚焦关闭按钮，关闭时恢复焦点）
    - 添加淡入淡出动画
    - _需求: 1.4, 8.1, 8.2, 8.9, 8.10_
  
  - [ ]* 17.3 编写 GalleryModal 单元测试
    - 测试模态框渲染
    - 测试关闭功能
    - 测试焦点管理
    - 测试 ARIA 属性
    - _需求: 11.2_

- [x] 18. 创建 GalleryCanvas 组件
  - [x] 18.1 创建 components/GalleryCanvas/GalleryCanvas.tsx
    - 封装 Three.js 渲染逻辑
    - 集成 useThreeScene hook
    - 集成 useGalleryInteraction hook
    - 处理加载完成回调
    - _需求: 1.2_
  
  - [ ]* 18.2 编写 GalleryCanvas 单元测试
    - 测试组件渲染
    - 测试 hooks 集成
    - _需求: 11.2_

- [x] 19. 重构 DistortionGallery 主容器组件
  - [x] 19.1 重构 components/DistortionGallery/DistortionGallery.tsx
    - 移除所有已提取的逻辑
    - 集成所有子组件（GalleryCanvas、LoadingState、GalleryOverlay、GalleryModal）
    - 集成 useGalleryState hook
    - 实现屏幕阅读器公告区域（aria-live）
    - 确保组件不超过 200 行
    - _需求: 1.1, 1.8, 8.11, 8.12_
  
  - [ ]* 19.2 编写 DistortionGallery 集成测试
    - 测试完整交互流程（拖拽、悬停、点击、点赞）
    - _需求: 11.4_
  
  - [ ]* 19.3 编写 DistortionGallery 属性测试
    - **属性 13: 回调函数调用** - 验证状态变更时调用回调
    - **验证需求: 5.7**
    - **属性 19: 屏幕阅读器宣布** - 验证操作结果宣布
    - **验证需求: 8.11**
    - _需求: 11.3_

- [ ] 20. 检查点 - 确保所有测试通过
  - 确保所有测试通过，询问用户是否有问题

### 阶段 5：性能优化（第 9-10 周）

- [ ] 21. 实现 React 性能优化
  - [ ] 21.1 为所有子组件添加 React.memo
    - 优化 ActionButtons 组件
    - 优化 GalleryOverlay 组件
    - 优化 GalleryModal 组件
    - 优化 LoadingState 组件
    - _需求: 7.1_
  
  - [ ] 21.2 在 DistortionGallery 中使用 useCallback
    - 优化 handleItemClick 回调
    - 优化 handleLike 回调
    - 优化 handleBookmark 回调
    - 优化 handleHoverChange 回调
    - _需求: 7.2_
  
  - [ ] 21.3 在 DistortionGallery 中使用 useMemo
    - 优化 hoveredItem 计算
    - 优化其他计算密集型操作
    - _需求: 7.3_

- [ ] 22. 实现 Three.js 性能优化
  - [ ] 22.1 在 useThreeScene 中实现视锥剔除
    - 创建 Frustum 对象
    - 更新网格可见性
    - _需求: 7.4_
  
  - [ ] 22.2 优化图片加载策略
    - 实现懒加载（可选，如果需要虚拟滚动）
    - 确保纹理压缩正常工作
    - _需求: 7.6, 7.7_
  
  - [ ] 22.3 创建 utils/performance/memoryMonitor.ts
    - 实现内存使用监控
    - 实现自动纹理释放（当内存过高时）
    - _需求: 7.10_

- [ ] 23. 性能测试和调优
  - [ ]* 23.1 创建性能基准测试
    - 测试渲染帧率
    - 测试加载时间
    - 测试内存使用
    - _需求: 11.6_
  
  - [ ] 23.2 使用 React DevTools Profiler 分析性能
    - 识别性能瓶颈
    - 优化渲染性能
    - _需求: 7.1, 7.2, 7.3_

- [ ] 24. 检查点 - 验证性能指标
  - 验证 FCP < 1.5s
  - 验证 LCP < 2.5s
  - 验证 FID < 100ms
  - 验证 CLS < 0.1
  - 验证交互帧率 > 55fps
  - 询问用户是否有问题


### 阶段 6：可访问性改进（第 11-12 周）

- [ ] 25. 实现键盘导航
  - [ ] 25.1 创建 hooks/useKeyboardNavigation.ts
    - 实现 Escape 键关闭模态框
    - 实现左右箭头键导航项目
    - 实现 Tab 键焦点陷阱（模态框内）
    - _需求: 2.5, 8.6, 8.7, 8.8_
  
  - [ ]* 25.2 编写 useKeyboardNavigation 单元测试
    - 测试 Escape 键功能
    - 测试箭头键导航
    - 测试 Tab 键焦点陷阱
    - _需求: 11.1_
  
  - [ ]* 25.3 编写 useKeyboardNavigation 属性测试
    - **属性 18: 键盘导航正确性** - 验证箭头键导航到相邻项
    - **验证需求: 8.7**
    - _需求: 11.3_

- [ ] 26. 集成键盘导航到组件
  - [ ] 26.1 在 DistortionGallery 中集成 useKeyboardNavigation
    - 连接键盘事件处理
    - 确保所有交互可通过键盘访问
    - _需求: 8.6, 8.7, 8.8_

- [ ] 27. 增强可访问性属性
  - [ ] 27.1 审查和增强所有 ARIA 属性
    - 确保所有按钮有 aria-label
    - 确保模态框有正确的 role 和 aria 属性
    - 确保动态内容有 aria-live 区域
    - _需求: 8.1, 8.2, 8.3, 8.4, 8.5, 8.11, 8.12_
  
  - [ ] 27.2 验证颜色对比度
    - 检查所有文本和背景的对比度
    - 确保对比度至少为 4.5:1
    - 调整颜色以满足 WCAG AA 标准
    - _需求: 8.13_
  
  - [ ] 27.3 实现 prefers-reduced-motion 支持
    - 检测用户运动偏好
    - 禁用或减少动画（如果用户设置了 prefers-reduced-motion）
    - _需求: 8.14_

- [ ] 28. 可访问性审计
  - [ ]* 28.1 使用自动化工具审计可访问性
    - 使用 axe-core 或类似工具
    - 修复发现的问题
    - _需求: 8.1-8.14_
  
  - [ ]* 28.2 手动测试可访问性
    - 使用屏幕阅读器测试（NVDA、JAWS、VoiceOver）
    - 使用键盘导航测试
    - 验证焦点管理
    - _需求: 8.1-8.14_

- [ ] 29. 检查点 - 验证可访问性合规
  - 验证 WCAG 2.1 AA 级别合规
  - 验证键盘导航完全支持
  - 验证屏幕阅读器兼容
  - 询问用户是否有问题

### 阶段 7：安全性和错误处理（第 13 周）

- [ ] 30. 实现安全措施
  - [ ] 30.1 添加输入清理
    - 安装 DOMPurify 库
    - 在 DistortionGallery 中清理所有用户输入和显示文本
    - _需求: 10.1, 10.6_
  
  - [ ] 30.2 实现图片 URL 验证
    - 在 useImageLoader 中验证图片来源
    - 创建白名单配置
    - _需求: 10.2_
  
  - [ ] 30.3 设置跨域属性
    - 确保所有图片加载时设置 crossOrigin="anonymous"
    - _需求: 10.3_
  
  - [ ] 30.4 创建 utils/rateLimiter.ts
    - 实现速率限制类
    - 在点赞/收藏操作中应用速率限制（每分钟最多 10 次）
    - _需求: 10.5_
  
  - [ ]* 30.5 配置内容安全策略（CSP）
    - 在 index.html 中添加 CSP meta 标签
    - 限制资源加载来源
    - _需求: 10.4_

- [ ] 31. 增强错误处理
  - [ ] 31.1 在 useImageLoader 中增强错误处理
    - 使用灰色占位符材质替代失败的图片
    - 记录错误到控制台
    - 继续加载其他图片
    - _需求: 9.1, 9.2, 9.3_
  
  - [ ] 31.2 在 useThreeScene 中处理 WebGL 不支持
    - 检测 WebGL 支持
    - 返回友好的错误消息
    - _需求: 9.4_
  
  - [ ] 31.3 在 DistortionGallery 中实现降级方案
    - 当 WebGL 不支持时显示静态网格布局
    - 提供友好的错误消息
    - _需求: 9.5_
  
  - [ ] 31.4 实现内存溢出保护
    - 在 useImageLoader 中限制同时加载的图片数量
    - 在 useThreeScene 中自动释放不可见的纹理
    - _需求: 9.6, 9.7_

- [ ] 32. 检查点 - 验证安全性和错误处理
  - 测试所有错误场景
  - 验证安全措施正常工作
  - 询问用户是否有问题

### 阶段 8：E2E 测试和文档（第 14 周）

- [ ] 33. 编写 E2E 测试
  - [ ]* 33.1 创建 e2e/gallery.spec.ts
    - 测试完整的用户交互流程（拖拽、悬停、点击、点赞、收藏）
    - 测试模态框打开和关闭
    - 测试键盘导航
    - _需求: 11.5_
  
  - [ ]* 33.2 创建 e2e/performance.spec.ts
    - 测试加载时间
    - 测试交互帧率
    - 验证性能指标（FCP、LCP、FID、CLS）
    - _需求: 11.5, 13.1, 13.2, 13.3, 13.4, 13.5_
  
  - [ ]* 33.3 创建 e2e/accessibility.spec.ts
    - 测试键盘导航
    - 测试屏幕阅读器兼容性
    - 测试焦点管理
    - _需求: 11.5_

- [ ] 34. 代码质量检查
  - [ ] 34.1 运行 TypeScript 严格模式检查
    - 修复所有类型错误
    - _需求: 12.1_
  
  - [ ] 34.2 运行 ESLint 检查
    - 修复所有警告
    - _需求: 12.2_
  
  - [ ] 34.3 运行 Prettier 格式化
    - 格式化所有代码
    - _需求: 12.3_
  
  - [ ] 34.4 验证代码覆盖率
    - 运行所有测试
    - 确保覆盖率 > 80%
    - _需求: 11.7_

- [ ] 35. 添加 JSDoc 注释
  - [ ] 35.1 为所有公共接口添加 JSDoc
    - 为所有组件添加注释
    - 为所有 hooks 添加注释
    - 为所有工具函数添加注释
    - _需求: 12.5_

- [ ] 36. 更新文档
  - [ ] 36.1 创建组件使用示例
    - 在设计文档中添加使用示例
    - _需求: 15.1_
  
  - [ ] 36.2 创建 hooks 使用示例
    - 在设计文档中添加 hooks 示例
    - _需求: 15.2_
  
  - [ ] 36.3 创建迁移指南
    - 记录从旧组件迁移到新组件的步骤
    - _需求: 15.5_
  
  - [ ] 36.4 创建故障排除指南
    - 记录常见问题和解决方案
    - _需求: 15.6_

- [ ] 37. 最终验收测试
  - [ ] 37.1 验证所有功能需求
    - 用户可以拖拽画廊浏览项目
    - 用户可以点击项目查看详情
    - 用户可以点赞和收藏项目
    - 用户可以使用键盘导航
    - 用户可以使用屏幕阅读器访问所有功能
    - _需求: 1.1-1.8, 2.1-2.5, 3.1-3.7, 4.1-4.9, 5.1-5.8, 6.1-6.9_
  
  - [ ] 37.2 验证所有性能指标
    - FCP < 1.5s
    - LCP < 2.5s
    - FID < 100ms
    - CLS < 0.1
    - 交互帧率 > 55fps
    - 加载时间 < 3s
    - _需求: 13.1-13.7_
  
  - [ ] 37.3 验证所有可访问性标准
    - WCAG 2.1 AA 级别合规
    - 键盘导航完全支持
    - 屏幕阅读器兼容
    - 颜色对比度 > 4.5:1
    - 焦点管理正确
    - _需求: 8.1-8.14_
  
  - [ ] 37.4 验证代码质量标准
    - 所有组件 < 200 行
    - 测试覆盖率 > 80%
    - TypeScript 严格模式无错误
    - ESLint 无警告
    - 所有 hooks 可独立测试
    - _需求: 1.8, 2.6, 2.7, 11.7, 12.1, 12.2, 12.7, 12.8_

- [ ] 38. 最终检查点 - 项目完成
  - 确保所有测试通过
  - 确保所有文档完整
  - 询问用户是否有任何最后的问题或调整

## 注意事项

- 标记为 `*` 的任务是可选的测试任务，可以跳过以加快 MVP 开发
- 每个任务都引用了相应的需求编号以确保可追溯性
- 检查点任务确保增量验证和用户反馈
- 属性测试验证通用正确性属性
- 单元测试验证具体示例和边界情况

## 依赖关系

- 阶段 1 必须在阶段 2 之前完成（hooks 依赖类型定义）
- 阶段 2 必须在阶段 3 之前完成（交互依赖场景管理）
- 阶段 3 必须在阶段 4 之前完成（UI 组件依赖交互逻辑）
- 阶段 4 必须在阶段 5 之前完成（性能优化需要完整的组件结构）
- 阶段 5 和阶段 6 可以并行进行
- 阶段 7 可以在阶段 5-6 之后进行
- 阶段 8 必须在所有其他阶段完成后进行

## 成功标准

完成所有任务后，系统应满足以下标准：

### 代码质量
- ✓ 所有组件 < 200 行
- ✓ 测试覆盖率 > 80%
- ✓ TypeScript 严格模式无错误
- ✓ ESLint 无警告
- ✓ 所有 hooks 可独立测试

### 性能
- ✓ FCP < 1.5s
- ✓ LCP < 2.5s
- ✓ FID < 100ms
- ✓ CLS < 0.1
- ✓ 交互帧率 > 55fps

### 可访问性
- ✓ WCAG 2.1 AA 级别合规
- ✓ 键盘导航完全支持
- ✓ 屏幕阅读器兼容
- ✓ 颜色对比度 > 4.5:1
- ✓ 焦点管理正确

### 用户体验
- ✓ 加载时间 < 3s
- ✓ 交互响应 < 100ms
- ✓ 动画流畅无卡顿
- ✓ 错误恢复机制完善
- ✓ 跨浏览器兼容性
