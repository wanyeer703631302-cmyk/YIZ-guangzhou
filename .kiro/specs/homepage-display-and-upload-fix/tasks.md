# 实施计划

- [x] 1. 编写 bug 条件探索测试
  - **Property 1: Fault Condition** - 首屏显示和上传按钮可见性
  - **关键**：此测试必须在未修复的代码上失败 - 失败确认 bug 存在
  - **不要在测试失败时尝试修复测试或代码**
  - **注意**：此测试编码了期望行为 - 在实施后通过时将验证修复
  - **目标**：展示证明 bug 存在的反例
  - **范围化 PBT 方法**：对于确定性 bug，将属性范围限定为具体的失败案例以确保可重现性
  - 测试设计文档中故障条件部分的实施细节
  - 测试断言应匹配设计文档中的期望行为属性
  - 在未修复的代码上运行测试
  - **预期结果**：测试失败（这是正确的 - 证明 bug 存在）
  - 记录发现的反例以理解根本原因
  - 当测试编写、运行并记录失败时标记任务完成
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 2. 编写保留属性测试（在实施修复之前）
  - **Property 2: Preservation** - 非 bug 条件下的行为
  - **重要**：遵循观察优先方法
  - 在未修复的代码上观察非 bug 输入的行为
  - 编写基于属性的测试，捕获保留要求中观察到的行为模式
  - 基于属性的测试生成许多测试用例以提供更强的保证
  - 在未修复的代码上运行测试
  - **预期结果**：测试通过（这确认了要保留的基线行为）
  - 当测试编写、运行并在未修复的代码上通过时标记任务完成
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_

- [x] 3. 首页显示和上传功能修复

  - [x] 3.1 修复 App.tsx 中的条件渲染和布局
    - 调整空状态检查条件，确保只有在 API 明确返回空数组时才显示空状态
    - 修复 section 的 CSS 类，移除或调整 `h-screen`，添加适当的居中样式
    - 优化 galleryData 赋值逻辑，优先使用 apiItems
    - 明确 fallbackGalleryData 只在开发环境使用
    - _Bug_Condition: isBugCondition(state) where (state.apiItems.length > 0 AND state.displayedContent == "empty") OR (state.galleryRendered AND state.galleryVisibleWithoutScroll == false)_
    - _Expected_Behavior: 当 API 成功返回数据时，首屏直接显示画廊内容，无需滚动_
    - _Preservation: 保留空状态提示、错误处理、侧边栏功能、画廊模式切换_
    - _Requirements: 2.1, 2.2, 2.3, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_

  - [x] 3.2 在 TopRightIcons 中添加上传按钮
    - 从 lucide-react 导入 Upload 图标
    - 添加 onUploadClick 和 uploadActive props
    - 渲染上传按钮，样式与现有按钮一致
    - 在 App.tsx 中添加 uploadOpen 状态并传递相关 props
    - _Bug_Condition: isBugCondition(state) where state.uploadButtonVisible == false_
    - _Expected_Behavior: 上传按钮在右上角可见，与搜索和用户按钮并列_
    - _Preservation: 保留搜索和用户图标的功能_
    - _Requirements: 2.4, 3.3_

  - [x] 3.3 修复 useInteractions 的认证检查
    - 在调用 API 前检查用户认证状态
    - 如果未认证，跳过 API 调用并返回空数据
    - 改进错误处理，静默处理 401/403 错误
    - _Bug_Condition: isBugCondition(state) where state.apiRequest == "/api/user/interactions" AND state.userAuthenticated == false AND state.responseStatus == 500_
    - _Expected_Behavior: 未认证时不调用 API 或优雅处理错误，不返回 500_
    - _Preservation: 保留已认证用户的点赞和收藏功能_
    - _Requirements: 2.5_

  - [x] 3.4 验证 bug 条件探索测试现在通过
    - **Property 1: Expected Behavior** - 首屏显示和上传按钮可见性
    - **重要**：重新运行任务 1 中的相同测试 - 不要编写新测试
    - 任务 1 中的测试编码了期望行为
    - 当此测试通过时，确认期望行为得到满足
    - 运行任务 1 中的 bug 条件探索测试
    - **预期结果**：测试通过（确认 bug 已修复）
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

  - [x] 3.5 验证保留测试仍然通过
    - **Property 2: Preservation** - 非 bug 条件下的行为
    - **重要**：重新运行任务 2 中的相同测试 - 不要编写新测试
    - 运行任务 2 中的保留属性测试
    - **预期结果**：测试通过（确认没有回归）
    - 确认修复后所有测试仍然通过（没有回归）

- [x] 4. 检查点 - 确保所有测试通过
  - 确保所有测试通过，如有问题请询问用户。
