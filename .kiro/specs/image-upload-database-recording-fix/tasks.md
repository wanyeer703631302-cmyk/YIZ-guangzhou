# Implementation Plan

- [x] 1. 编写 bug 条件探索测试
  - **Property 1: Fault Condition** - 数据库记录创建失败检测
  - **重要**: 在未修复的代码上运行此测试 - 测试应该失败
  - **目标**: 暴露反例证明 bug 存在，验证根本原因假设
  - **范围化 PBT 方法**: 针对具体失败场景（数据库不可用、userId 缺失、连接超时）编写测试
  - 测试场景 1: DATABASE_URL 未配置时，Cloudinary 上传成功但数据库保存失败
  - 测试场景 2: userId 为 undefined 时，数据库保存因外键约束失败
  - 测试场景 3: 数据库连接超时时，操作失败且返回明确错误
  - 测试场景 4: Cloudinary 成功但数据库失败时，验证是否产生孤立文件
  - 在未修复代码上运行测试
  - **预期结果**: 测试失败（这是正确的 - 证明 bug 存在）
  - 记录发现的反例以理解根本原因
  - 当测试编写完成、运行并记录失败后，标记任务完成
  - _Requirements: 2.1, 2.2, 2.3_

- [x] 2. 编写保留性属性测试（在实施修复前）
  - **Property 2: Preservation** - 历史数据和非上传功能行为保留
  - **重要**: 遵循观察优先方法
  - 观察: 在未修复代码上查询历史图片（GET /api/assets），记录返回的记录结构和内容
  - 观察: 在未修复代码上测试展示模式切换，记录渲染行为
  - 观察: 在未修复代码上测试演示模式上传，记录 localStorage 存储逻辑
  - 编写基于属性的测试: 对于所有不涉及新图片上传的操作，行为必须与观察到的一致
  - 测试 1: 历史图片查询返回相同的记录（id, title, url, createdAt 等字段完全一致）
  - 测试 2: 展示模式切换（网格视图 ↔ 列表视图）行为保持不变
  - 测试 3: UI 交互流程（拖拽、文件选择、预览）体验保持不变
  - 测试 4: 演示模式的 localStorage 逻辑完全不受影响
  - 在未修复代码上运行测试
  - **预期结果**: 测试通过（确认基线行为以供保留）
  - 当测试编写完成、运行并在未修复代码上通过后，标记任务完成
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [x] 3. 修复图片上传数据库记录问题

  - [x] 3.1 在 api/upload.ts 中添加数据库可用性检查
    - 从 ../lib/prisma 导入 isDatabaseAvailable
    - 在 withAuth 回调内部、multer 中间件运行后添加检查
    - 如果 isDatabaseAvailable 为 false，返回 503 错误响应
    - 错误消息: "数据库服务不可用，请联系管理员配置 DATABASE_URL"
    - _Bug_Condition: isBugCondition(uploadRequest) where uploadRequest.dbSaveResult.success == false due to database unavailable_
    - _Expected_Behavior: 数据库不可用时立即返回 503 错误，避免执行 Cloudinary 上传_
    - _Preservation: 不影响历史图片查询、展示模式切换、演示模式上传_
    - _Requirements: 2.1_

  - [x] 3.2 在 api/upload.ts 中添加 userId 验证
    - 在数据库保存前（第 180 行附近）检查 authReq.userId 是否存在
    - 如果 userId 为 undefined，返回 401 错误响应
    - 错误消息: "用户认证信息缺失"
    - _Bug_Condition: isBugCondition(uploadRequest) where userId is undefined causing foreign key constraint failure_
    - _Expected_Behavior: userId 缺失时返回 401 错误，防止外键约束错误_
    - _Preservation: 不影响已认证用户的所有操作_
    - _Requirements: 2.1_

  - [x] 3.3 增强 api/upload.ts 中的数据库保存错误处理
    - 在第 180-230 行的 try-catch 块中改进错误处理
    - 记录详细错误日志（包括 userId, file.size, cloudinaryResult.secure_url）
    - 确保任何数据库错误都返回 500 错误响应，包含具体错误信息
    - 确保 res.status(201).json 只在数据库保存成功后调用
    - _Bug_Condition: isBugCondition(uploadRequest) where dbSaveResult throws exception but success response is sent_
    - _Expected_Behavior: 数据库保存失败时返回 500 错误，不返回成功响应_
    - _Preservation: 不影响成功上传的正常流程_
    - _Requirements: 2.1, 2.3_

  - [x] 3.4 在 api/upload.ts 中添加数据库记录验证
    - 在 prisma.asset.create 成功后、返回响应前添加验证查询
    - 使用 prisma.asset.findUnique 查询刚创建的记录
    - 如果查询失败或返回 null，记录错误并返回 500 响应
    - _Bug_Condition: isBugCondition(uploadRequest) where record creation appears successful but is not persisted_
    - _Expected_Behavior: 确保记录确实已持久化到数据库后才返回成功_
    - _Preservation: 不影响查询历史记录的逻辑_
    - _Requirements: 2.2, 2.3_

  - [x] 3.5 在 api/upload.ts 中添加 Cloudinary 清理逻辑
    - 在数据库保存的 catch 块中，调用 cloudinary.uploader.destroy(cloudinaryResult.public_id)
    - 记录清理操作的结果（成功或失败）
    - 实现补偿事务模式，避免孤立文件
    - _Bug_Condition: isBugCondition(uploadRequest) where Cloudinary upload succeeds but database save fails_
    - _Expected_Behavior: 数据库保存失败时删除已上传到 Cloudinary 的文件_
    - _Preservation: 不影响成功上传的文件管理_
    - _Requirements: 2.1_

  - [x] 3.6 改进 app/src/services/api.ts 中的错误响应处理
    - 在第 180-220 行的上传逻辑中改进错误处理
    - 验证 response.ok 检查在所有错误情况下都能正确触发
    - 确保非 JSON 响应的错误处理能够提取有意义的错误消息
    - 添加对 503 状态码的特殊处理，显示数据库不可用的友好提示
    - _Bug_Condition: isBugCondition(uploadRequest) where error responses are not properly handled in frontend_
    - _Expected_Behavior: 所有错误场景都向用户显示明确的错误消息_
    - _Preservation: 不影响成功上传的 UI 反馈_
    - _Requirements: 2.1_

  - [x] 3.7 验证 bug 条件探索测试现在通过
    - **Property 1: Expected Behavior** - 数据库记录创建保障
    - **重要**: 重新运行任务 1 中的相同测试 - 不要编写新测试
    - 任务 1 中的测试编码了预期行为
    - 当此测试通过时，确认预期行为已满足
    - 运行任务 1 中的 bug 条件探索测试
    - **预期结果**: 测试通过（确认 bug 已修复）
    - _Requirements: 2.1, 2.2, 2.3_

  - [x] 3.8 验证保留性测试仍然通过
    - **Property 2: Preservation** - 历史数据和非上传功能行为保留
    - **重要**: 重新运行任务 2 中的相同测试 - 不要编写新测试
    - 运行任务 2 中的保留性属性测试
    - **预期结果**: 测试通过（确认无回归）
    - 确认修复后所有测试仍然通过（无回归）

- [x] 4. 检查点 - 确保所有测试通过
  - 确保所有测试通过，如有疑问请询问用户
