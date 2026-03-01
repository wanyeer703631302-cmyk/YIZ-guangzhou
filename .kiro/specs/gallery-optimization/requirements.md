# 需求文档：画廊优化 (Gallery Optimization)

## 简介

本文档定义了 DistortionGallery 组件重构优化的功能和非功能需求。当前组件约 500 行，将场景管理、交互逻辑、UI 渲染和状态管理混合在一起。重构目标是将组件拆分为更小的、可维护的模块，提取自定义 hooks，优化性能，增强可访问性，并建立完整的测试策略。

## 术语表

- **DistortionGallery**: 主容器组件，负责协调所有子组件和 hooks
- **GalleryCanvas**: Three.js 渲染层组件，负责 WebGL 场景渲染
- **GalleryOverlay**: 悬停交互层组件，显示在画廊项目上方的操作界面
- **GalleryModal**: 详情弹窗组件，显示选中项目的完整信息
- **ActionButtons**: 可复用的操作按钮组件（点赞、收藏）
- **LoadingState**: 加载状态组件，显示加载进度
- **ImageViewer**: 图片查看器组件，用于模态框中显示大图
- **ThreeScene**: Three.js 场景对象，包含相机、渲染器、网格等
- **GalleryItem**: 画廊项目数据结构，包含 id、标题、品牌、分类、年份、图片 URL
- **Raycaster**: Three.js 射线投射器，用于检测鼠标与 3D 对象的交互
- **Texture**: Three.js 纹理对象，用于在 3D 网格上显示图片
- **Mesh**: Three.js 网格对象，3D 场景中的可渲染对象
- **EffectComposer**: Three.js 后处理管线，用于应用扭曲效果
- **NDC**: 归一化设备坐标（Normalized Device Coordinates），范围 [-1, 1]
- **FCP**: 首次内容绘制（First Contentful Paint）
- **LCP**: 最大内容绘制（Largest Contentful Paint）
- **FID**: 首次输入延迟（First Input Delay）
- **CLS**: 累积布局偏移（Cumulative Layout Shift）
- **WCAG**: Web 内容可访问性指南（Web Content Accessibility Guidelines）
- **ARIA**: 无障碍富互联网应用（Accessible Rich Internet Applications）
- **WebGL**: Web 图形库（Web Graphics Library），用于浏览器中的 3D 渲染
- **CSP**: 内容安全策略（Content Security Policy）
- **XSS**: 跨站脚本攻击（Cross-Site Scripting）

## 需求

### 需求 1：组件拆分与模块化

**用户故事：** 作为开发者，我希望将大型组件拆分为小型、单一职责的组件，以便代码更易于理解、测试和维护。

#### 验收标准

1. THE DistortionGallery SHALL 作为主容器组件协调所有子组件
2. THE GalleryCanvas SHALL 负责 Three.js 场景的渲染和管理
3. THE GalleryOverlay SHALL 在悬停时显示操作按钮
4. THE GalleryModal SHALL 显示选中项目的详细信息
5. THE ActionButtons SHALL 作为可复用组件在 GalleryOverlay 和 GalleryModal 中使用
6. THE LoadingState SHALL 显示图片加载进度
7. THE ImageViewer SHALL 在模态框中显示大图
8. WHEN 组件拆分完成 THEN 每个组件文件 SHALL 不超过 200 行代码

### 需求 2：自定义 Hooks 提取

**用户故事：** 作为开发者，我希望将复杂的逻辑提取到自定义 hooks 中，以便逻辑可以独立测试和复用。

#### 验收标准

1. THE useThreeScene Hook SHALL 管理 Three.js 场景的初始化、渲染循环和资源清理
2. THE useGalleryInteraction Hook SHALL 处理所有用户交互事件（拖拽、悬停、点击、滚轮）
3. THE useGalleryState Hook SHALL 管理画廊的状态（悬停项、选中项、点赞、收藏）
4. THE useImageLoader Hook SHALL 处理图片的并行加载和圆角处理
5. THE useKeyboardNavigation Hook SHALL 实现键盘导航功能
6. WHEN hooks 提取完成 THEN 每个 hook 文件 SHALL 不超过 200 行代码
7. WHEN hooks 提取完成 THEN 每个 hook SHALL 可以独立测试而不依赖其他 hooks

### 需求 3：Three.js 场景管理

**用户故事：** 作为用户，我希望画廊能够流畅地渲染和显示图片，以便获得良好的视觉体验。

#### 验收标准

1. WHEN 组件挂载 THEN THE useThreeScene SHALL 初始化 Three.js 场景、相机和渲染器
2. WHEN 场景初始化 THEN THE useThreeScene SHALL 创建扭曲效果的后处理管线
3. WHEN 图片加载完成 THEN THE useThreeScene SHALL 创建网格布局并添加到场景中
4. WHEN 渲染循环运行 THEN THE useThreeScene SHALL 以目标帧率（60fps）渲染场景
5. WHEN 窗口大小改变 THEN THE useThreeScene SHALL 调整相机和渲染器尺寸
6. WHEN 组件卸载 THEN THE useThreeScene SHALL 清理所有 Three.js 资源（几何体、材质、纹理、渲染器）
7. WHEN WebGL 不支持 THEN THE useThreeScene SHALL 返回错误信息

### 需求 4：用户交互处理

**用户故事：** 作为用户，我希望能够通过拖拽、点击和滚轮与画廊交互，以便浏览和选择项目。

#### 验收标准

1. WHEN 用户按下鼠标 THEN THE useGalleryInteraction SHALL 开始拖拽模式
2. WHEN 用户拖拽画廊 THEN THE useGalleryInteraction SHALL 更新网格偏移量和速度
3. WHEN 用户释放鼠标 THEN THE useGalleryInteraction SHALL 应用惯性滚动效果
4. WHEN 拖拽距离小于阈值（5px）THEN THE useGalleryInteraction SHALL 触发点击事件
5. WHEN 拖拽距离大于阈值 THEN THE useGalleryInteraction SHALL 不触发点击事件
6. WHEN 用户悬停在项目上 THEN THE useGalleryInteraction SHALL 通过射线检测识别悬停项
7. WHEN 用户滚动滚轮 THEN THE useGalleryInteraction SHALL 调整网格偏移量
8. WHEN 用户拖拽或滚动 THEN THE useGalleryInteraction SHALL 根据速度动态调整扭曲效果
9. WHEN 用户停止交互 THEN THE useGalleryInteraction SHALL 平滑地将扭曲效果恢复到 0

### 需求 5：状态管理

**用户故事：** 作为用户，我希望我的点赞和收藏操作能够被正确记录和显示，以便管理我喜欢的项目。

#### 验收标准

1. THE useGalleryState SHALL 管理悬停项索引状态
2. THE useGalleryState SHALL 管理选中项状态
3. THE useGalleryState SHALL 管理点赞状态（使用 Set 数据结构）
4. THE useGalleryState SHALL 管理收藏状态（使用 Set 数据结构）
5. WHEN 用户切换点赞状态 THEN THE useGalleryState SHALL 返回新的不可变 Set 实例
6. WHEN 用户切换收藏状态 THEN THE useGalleryState SHALL 返回新的不可变 Set 实例
7. WHEN 状态改变 THEN THE useGalleryState SHALL 调用相应的回调函数（onLike、onBookmark、onItemSelect）
8. THE useGalleryState SHALL 提供查询方法（isLiked、isBookmarked）

### 需求 6：图片加载与处理

**用户故事：** 作为用户，我希望图片能够快速加载并显示圆角效果，以便获得美观的视觉体验。

#### 验收标准

1. WHEN 组件挂载 THEN THE useImageLoader SHALL 并行加载所有图片
2. WHEN 图片加载 THEN THE useImageLoader SHALL 应用圆角处理（20px 圆角半径）
3. WHEN 图片加载 THEN THE useImageLoader SHALL 创建 Three.js 纹理对象
4. WHEN 图片加载 THEN THE useImageLoader SHALL 设置纹理色彩空间为 SRGB
5. WHEN 图片加载进度更新 THEN THE useImageLoader SHALL 调用 onProgress 回调
6. WHEN 所有图片加载完成 THEN THE useImageLoader SHALL 调用 onComplete 回调
7. WHEN 图片加载失败 THEN THE useImageLoader SHALL 返回 null 并继续加载其他图片
8. WHEN 图片加载失败 THEN THE useImageLoader SHALL 调用 onError 回调
9. WHEN 图片尺寸超过 1024px THEN THE useImageLoader SHALL 压缩纹理以节省内存

### 需求 7：性能优化

**用户故事：** 作为用户，我希望画廊能够流畅运行，不出现卡顿或延迟，以便获得良好的用户体验。

#### 验收标准

1. THE DistortionGallery SHALL 使用 React.memo 优化子组件渲染
2. THE DistortionGallery SHALL 使用 useCallback 优化回调函数
3. THE DistortionGallery SHALL 使用 useMemo 优化计算密集型操作
4. THE useThreeScene SHALL 实现视锥剔除以减少渲染负载
5. THE useThreeScene SHALL 限制渲染帧率为 60fps
6. THE useImageLoader SHALL 实现图片懒加载策略
7. THE useImageLoader SHALL 压缩大尺寸纹理
8. THE useGalleryInteraction SHALL 使用节流优化悬停检测（16ms 间隔）
9. WHEN 组件卸载 THEN THE useThreeScene SHALL 释放所有 WebGL 资源
10. WHEN 内存使用过高 THEN THE System SHALL 自动释放不可见的纹理

### 需求 8：可访问性支持

**用户故事：** 作为使用辅助技术的用户，我希望能够通过键盘和屏幕阅读器访问画廊的所有功能，以便无障碍地使用应用。

#### 验收标准

1. THE GalleryModal SHALL 使用 role="dialog" 和 aria-modal="true" 属性
2. THE GalleryModal SHALL 使用 aria-labelledby 和 aria-describedby 关联标题和描述
3. THE ActionButtons SHALL 使用 aria-label 描述按钮功能
4. THE ActionButtons SHALL 使用 aria-pressed 指示按钮状态
5. THE ActionButtons SHALL 使用 role="group" 和 aria-label 组织按钮组
6. WHEN 用户按下 Escape 键 THEN THE useKeyboardNavigation SHALL 关闭模态框
7. WHEN 用户按下左右箭头键 THEN THE useKeyboardNavigation SHALL 导航到上一个或下一个项目
8. WHEN 用户按下 Tab 键 THEN THE useKeyboardNavigation SHALL 在模态框内循环焦点
9. WHEN 模态框打开 THEN THE GalleryModal SHALL 将焦点移到关闭按钮
10. WHEN 模态框关闭 THEN THE GalleryModal SHALL 恢复之前的焦点
11. WHEN 用户操作 THEN THE DistortionGallery SHALL 向屏幕阅读器宣布操作结果
12. THE DistortionGallery SHALL 提供 aria-live 区域用于动态内容宣布
13. THE DistortionGallery SHALL 确保所有文本和背景的颜色对比度至少为 4.5:1
14. WHEN 用户设置 prefers-reduced-motion THEN THE DistortionGallery SHALL 禁用或减少动画

### 需求 9：错误处理与恢复

**用户故事：** 作为用户，我希望当出现错误时应用能够优雅地处理并提供反馈，以便我知道发生了什么并能够继续使用。

#### 验收标准

1. WHEN 图片加载失败 THEN THE useImageLoader SHALL 使用灰色占位符材质
2. WHEN 图片加载失败 THEN THE useImageLoader SHALL 记录错误到控制台
3. WHEN 图片加载失败 THEN THE useImageLoader SHALL 继续加载其他图片
4. WHEN WebGL 不支持 THEN THE DistortionGallery SHALL 显示友好的错误消息
5. WHEN WebGL 不支持 THEN THE DistortionGallery SHALL 提供降级方案（静态网格布局）
6. WHEN 内存溢出 THEN THE useImageLoader SHALL 限制同时加载的图片数量
7. WHEN 内存溢出 THEN THE useThreeScene SHALL 自动释放不可见的纹理
8. WHEN 交互冲突 THEN THE useGalleryInteraction SHALL 使用 hasMoved 标志区分拖拽和点击

### 需求 10：安全性

**用户故事：** 作为系统管理员，我希望应用能够防止常见的安全漏洞，以便保护用户数据和系统安全。

#### 验收标准

1. THE DistortionGallery SHALL 使用 DOMPurify 清理所有用户输入
2. THE useImageLoader SHALL 验证图片 URL 来源是否在白名单中
3. THE useImageLoader SHALL 设置图片 crossOrigin 属性为 "anonymous"
4. THE System SHALL 实施内容安全策略（CSP）限制资源加载
5. THE System SHALL 实施速率限制防止滥用（每分钟最多 10 次点赞操作）
6. THE System SHALL 防止 XSS 攻击通过清理所有显示的文本内容

### 需求 11：测试覆盖

**用户故事：** 作为开发者，我希望有完整的测试覆盖，以便确保代码质量和功能正确性。

#### 验收标准

1. THE System SHALL 为所有 hooks 提供单元测试
2. THE System SHALL 为所有组件提供单元测试
3. THE System SHALL 为关键功能提供属性测试（使用 fast-check）
4. THE System SHALL 为完整交互流程提供集成测试
5. THE System SHALL 为用户场景提供 E2E 测试（使用 Playwright）
6. THE System SHALL 为性能指标提供基准测试
7. WHEN 测试运行 THEN 代码覆盖率 SHALL 大于 80%
8. WHEN 属性测试运行 THEN 每个属性 SHALL 至少执行 100 次迭代

### 需求 12：代码质量

**用户故事：** 作为开发者，我希望代码遵循最佳实践和编码规范，以便代码易于维护和扩展。

#### 验收标准

1. THE System SHALL 使用 TypeScript 严格模式
2. THE System SHALL 通过 ESLint 检查无警告
3. THE System SHALL 使用 Prettier 格式化代码
4. THE System SHALL 为所有公共接口提供 TypeScript 类型定义
5. THE System SHALL 为所有组件和 hooks 提供 JSDoc 注释
6. THE System SHALL 将常量提取到独立的配置文件
7. THE System SHALL 遵循单一职责原则
8. THE System SHALL 遵循 DRY（Don't Repeat Yourself）原则

### 需求 13：性能指标

**用户故事：** 作为产品经理，我希望应用满足性能指标，以便提供优秀的用户体验。

#### 验收标准

1. WHEN 应用加载 THEN 首次内容绘制（FCP）SHALL 小于 1.5 秒
2. WHEN 应用加载 THEN 最大内容绘制（LCP）SHALL 小于 2.5 秒
3. WHEN 用户交互 THEN 首次输入延迟（FID）SHALL 小于 100 毫秒
4. WHEN 应用运行 THEN 累积布局偏移（CLS）SHALL 小于 0.1
5. WHEN 用户拖拽画廊 THEN 渲染帧率 SHALL 大于 55fps
6. WHEN 图片加载 THEN 总加载时间 SHALL 小于 3 秒
7. WHEN 用户操作 THEN 交互响应时间 SHALL 小于 100 毫秒

### 需求 14：浏览器兼容性

**用户故事：** 作为用户，我希望应用能够在主流浏览器中正常运行，以便使用我喜欢的浏览器访问。

#### 验收标准

1. THE System SHALL 支持 Chrome 最新版本
2. THE System SHALL 支持 Firefox 最新版本
3. THE System SHALL 支持 Safari 最新版本
4. THE System SHALL 支持 Edge 最新版本
5. WHEN 浏览器不支持 WebGL THEN THE System SHALL 提供降级方案
6. WHEN 浏览器不支持某些 API THEN THE System SHALL 提供 polyfill 或替代方案

### 需求 15：文档与维护

**用户故事：** 作为开发者，我希望有完整的文档，以便理解代码结构和使用方法。

#### 验收标准

1. THE System SHALL 提供组件使用示例
2. THE System SHALL 提供 hooks 使用示例
3. THE System SHALL 提供 API 文档
4. THE System SHALL 提供架构设计文档
5. THE System SHALL 提供迁移指南
6. THE System SHALL 提供故障排除指南
7. THE System SHALL 在代码中提供内联注释解释复杂逻辑

## 约束条件

### 技术约束

1. 必须使用 React 18.2.0 或更高版本
2. 必须使用 TypeScript 5.3.0 或更高版本
3. 必须使用 Three.js 0.160.0 或更高版本
4. 必须支持 WebGL 1.0 或更高版本
5. 必须在现代浏览器（Chrome、Firefox、Safari、Edge）中运行

### 性能约束

1. 单个组件文件不得超过 200 行代码
2. 单个 hook 文件不得超过 200 行代码
3. 渲染帧率必须保持在 55fps 以上
4. 内存使用必须在合理范围内（< 500MB）
5. 图片加载时间必须小于 3 秒

### 可访问性约束

1. 必须符合 WCAG 2.1 AA 级别标准
2. 必须支持键盘导航
3. 必须支持屏幕阅读器
4. 颜色对比度必须至少为 4.5:1
5. 必须尊重用户的运动偏好设置

### 安全约束

1. 必须防止 XSS 攻击
2. 必须验证图片来源
3. 必须实施内容安全策略（CSP）
4. 必须实施速率限制
5. 必须清理所有用户输入

### 测试约束

1. 代码覆盖率必须大于 80%
2. 所有公共 API 必须有单元测试
3. 关键功能必须有属性测试
4. 用户场景必须有 E2E 测试
5. 性能指标必须有基准测试

## 实施优先级

### 高优先级（必须实现）

1. 需求 1：组件拆分与模块化
2. 需求 2：自定义 Hooks 提取
3. 需求 3：Three.js 场景管理
4. 需求 4：用户交互处理
5. 需求 5：状态管理
6. 需求 6：图片加载与处理

### 中优先级（应该实现）

7. 需求 7：性能优化
8. 需求 8：可访问性支持
9. 需求 9：错误处理与恢复
10. 需求 11：测试覆盖
11. 需求 12：代码质量

### 低优先级（可以实现）

12. 需求 10：安全性
13. 需求 13：性能指标
14. 需求 14：浏览器兼容性
15. 需求 15：文档与维护

## 验收测试

### 功能验收测试

1. 用户可以拖拽画廊浏览项目
2. 用户可以点击项目查看详情
3. 用户可以点赞和收藏项目
4. 用户可以使用键盘导航
5. 用户可以使用屏幕阅读器访问所有功能
6. 图片加载失败时显示占位符
7. WebGL 不支持时显示降级方案

### 性能验收测试

1. FCP < 1.5s
2. LCP < 2.5s
3. FID < 100ms
4. CLS < 0.1
5. 交互帧率 > 55fps
6. 加载时间 < 3s

### 可访问性验收测试

1. WCAG 2.1 AA 级别合规
2. 键盘导航完全支持
3. 屏幕阅读器兼容
4. 颜色对比度 > 4.5:1
5. 焦点管理正确

### 代码质量验收测试

1. 所有组件 < 200 行
2. 测试覆盖率 > 80%
3. TypeScript 严格模式无错误
4. ESLint 无警告
5. 所有 hooks 可独立测试

## 风险与缓解

### 风险 1：性能下降

**描述：** 组件拆分可能导致额外的渲染开销

**缓解措施：**
- 使用 React.memo 优化组件
- 使用 useCallback 和 useMemo 优化性能
- 进行性能基准测试
- 使用 React DevTools Profiler 分析性能

### 风险 2：测试复杂度增加

**描述：** 组件拆分后测试用例数量增加

**缓解措施：**
- 使用属性测试减少测试用例数量
- 使用测试工具库简化测试编写
- 编写可复用的测试辅助函数
- 优先测试关键功能

### 风险 3：迁移成本

**描述：** 重构可能影响现有功能

**缓解措施：**
- 分阶段迁移（14 周计划）
- 保持向后兼容
- 编写完整的集成测试
- 进行充分的回归测试

### 风险 4：浏览器兼容性

**描述：** 某些浏览器可能不支持 WebGL 或某些 API

**缓解措施：**
- 提供降级方案
- 使用 polyfill
- 进行跨浏览器测试
- 提供友好的错误消息

## 成功标准

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

## 附录

### 参考文档

1. 设计文档：`.kiro/specs/gallery-optimization/design.md`
2. React 文档：https://react.dev/
3. Three.js 文档：https://threejs.org/docs/
4. WCAG 2.1 指南：https://www.w3.org/WAI/WCAG21/quickref/
5. Web Vitals：https://web.dev/vitals/

### 相关标准

1. WCAG 2.1 AA 级别
2. ARIA 1.2 规范
3. ECMAScript 2022
4. TypeScript 5.3
5. WebGL 1.0 规范

### 工具和库

1. React 18.2.0
2. TypeScript 5.3.0
3. Three.js 0.160.0
4. Vitest 1.0.0
5. Playwright 1.40.0
6. fast-check 3.15.0
7. DOMPurify 3.0.0
