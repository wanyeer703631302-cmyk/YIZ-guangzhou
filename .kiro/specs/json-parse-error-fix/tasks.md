# 实施计划

- [x] 1. 编写bug条件探索测试
  - **Property 1: Fault Condition** - 非JSON响应导致解析错误
  - **关键**: 此测试必须在未修复的代码上失败 - 失败确认bug存在
  - **不要在测试失败时尝试修复测试或代码**
  - **注意**: 此测试编码了预期行为 - 在实施修复后通过时将验证修复
  - **目标**: 展示证明bug存在的反例
  - **作用域PBT方法**: 对于确定性bug，将属性限定在具体的失败案例以确保可重现性
  - 测试实现细节来自设计中的故障条件
  - 测试断言应匹配设计中的预期行为属性
  - 在未修复的代码上运行测试
  - **预期结果**: 测试失败（这是正确的 - 证明bug存在）
  - 记录发现的反例以理解根本原因
  - 当测试编写完成、运行并记录失败时标记任务完成
  - 测试案例：
    - 纯文本错误响应（Content-Type: text/plain，body: "A server error occurred"）
    - HTML错误页面（Content-Type: text/html）
    - 空响应体（Content-Type: text/plain，body: ""）
    - 错误Content-Type但有效JSON（Content-Type: text/plain，body: valid JSON）
  - 断言：当前代码抛出JSON解析错误或返回通用"Network error"
  - 预期反例：`SyntaxError: Unexpected token` 或 `Unexpected end of JSON input`
  - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [x] 2. 编写保留性属性测试（在实施修复前）
  - **Property 2: Preservation** - JSON响应处理保持不变
  - **重要**: 遵循观察优先方法
  - 在未修复的代码上观察非bug输入的行为
  - 编写基于属性的测试，捕获保留需求中观察到的行为模式
  - 基于属性的测试生成大量测试用例以提供更强保证
  - 在未修复的代码上运行测试
  - **预期结果**: 测试通过（确认要保留的基线行为）
  - 当测试编写完成、运行并在未修复代码上通过时标记任务完成
  - 测试案例：
    - 成功JSON响应（HTTP 200 + Content-Type: application/json + 有效JSON body）
    - JSON错误响应（HTTP 4xx/5xx + Content-Type: application/json + JSON body含error字段）
    - 认证头添加（验证Authorization头正确添加）
    - FormData上传（验证uploadAsset方法正确处理文件上传）
  - 断言：修复后的行为与原始代码完全相同
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 3. 修复非JSON响应解析错误

  - [x] 3.1 实施修复
    - 在调用 `response.json()` 前添加Content-Type检查
    - 获取 `response.headers.get('content-type')`
    - 检查是否包含 'application/json'
    - 对于JSON响应：继续使用 `response.json()`
    - 对于非JSON响应：使用 `response.text()` 读取纯文本
    - 将纯文本响应包装成标准ApiResponse格式 `{ success: false, error: textContent }`
    - 处理空响应体情况（返回 "Empty response" 或类似信息）
    - 保持所有现有的JSON响应处理逻辑不变
    - 保持认证头、FormData上传等功能不变
    - _Bug_Condition: isBugCondition(response) where (NOT response.headers.get('Content-Type').includes('application/json')) OR (response.body is not valid JSON)_
    - _Expected_Behavior: 将响应体作为纯文本读取，返回 { success: false, error: <actual_text_content> }，不抛出JSON解析错误_
    - _Preservation: JSON响应解析、错误处理、认证头添加、FormData上传等功能保持不变_
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3, 3.4, 3.5_

  - [x] 3.2 验证bug条件探索测试现在通过
    - **Property 1: Expected Behavior** - 非JSON响应的优雅处理
    - **重要**: 重新运行步骤1中的相同测试 - 不要编写新测试
    - 步骤1中的测试编码了预期行为
    - 当此测试通过时，确认预期行为得到满足
    - 运行步骤1中的bug条件探索测试
    - **预期结果**: 测试通过（确认bug已修复）
    - _Requirements: 设计中的预期行为属性_

  - [x] 3.3 验证保留性测试仍然通过
    - **Property 2: Preservation** - JSON响应处理保持不变
    - **重要**: 重新运行步骤2中的相同测试 - 不要编写新测试
    - 运行步骤2中的保留性属性测试
    - **预期结果**: 测试通过（确认无回归）
    - 确认修复后所有测试仍然通过（无回归）

- [x] 4. 检查点 - 确保所有测试通过
  - 确保所有测试通过，如有问题请询问用户
