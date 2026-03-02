# JSON解析错误修复设计文档

## Overview

当后端服务返回非JSON格式的响应（如纯文本错误信息）时，前端API客户端在调用 `response.json()` 时会抛出JSON解析错误，导致用户看到维护模式页面。本修复通过在解析前检查Content-Type，并在解析失败时尝试读取纯文本响应，确保后端的实际错误信息能够正确传递给用户。

修复策略：
1. 在调用 `response.json()` 前检查响应的 Content-Type
2. 对于非JSON响应，使用 `response.text()` 读取纯文本
3. 将纯文本包装成标准 ApiResponse 格式
4. 在catch块中也尝试读取响应文本内容

## Glossary

- **Bug_Condition (C)**: 后端返回非JSON格式的响应（Content-Type不是application/json或响应体不是有效JSON）
- **Property (P)**: 系统应该将响应体作为纯文本读取，并包装成标准ApiResponse格式返回，保留原始错误信息
- **Preservation**: 现有的JSON响应解析、错误处理、认证头添加、FormData上传等功能必须保持不变
- **request方法**: `api.ts` 中 ApiClient 类的私有方法，负责处理所有HTTP请求、添加认证头和错误处理
- **ApiResponse**: 标准响应格式，包含 `success` 布尔值、可选的 `data` 和 `error` 字段
- **Content-Type**: HTTP响应头，指示响应体的媒体类型（如 application/json、text/plain）

## Bug Details

### Fault Condition

当后端服务返回非JSON格式的响应时，`request` 方法会无条件调用 `response.json()`，导致JSON解析失败并抛出异常。catch块捕获异常后返回通用的 "Network error" 错误信息，丢失了后端返回的实际错误内容。

**Formal Specification:**
```
FUNCTION isBugCondition(response)
  INPUT: response of type Response (Fetch API Response object)
  OUTPUT: boolean
  
  RETURN (NOT response.headers.get('Content-Type').includes('application/json'))
         OR (response.body is not valid JSON)
END FUNCTION
```

### Examples

- **示例1**: 后端返回纯文本 "A server error occurred"，Content-Type为 text/plain
  - 当前行为: 抛出 `Unexpected token 'A', "A server e"... is not valid JSON`
  - 期望行为: 返回 `{ success: false, error: "A server error occurred" }`

- **示例2**: 后端返回HTML错误页面，Content-Type为 text/html
  - 当前行为: 抛出JSON解析错误，返回 "Network error"
  - 期望行为: 返回 `{ success: false, error: "<html>...</html>" }` 或提取的错误信息

- **示例3**: 后端返回空响应体，Content-Type为 text/plain
  - 当前行为: 抛出JSON解析错误
  - 期望行为: 返回 `{ success: false, error: "Empty response" }` 或类似信息

- **边缘情况**: 后端返回有效JSON但Content-Type错误地设置为 text/plain
  - 期望行为: 尝试作为JSON解析，如果失败则作为纯文本处理

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- 当后端返回有效的JSON响应（Content-Type为application/json）时，必须继续正常解析
- 当后端返回JSON错误响应（包含error字段）时，必须继续正确提取错误信息
- 当网络请求完全失败时，catch块必须继续捕获并返回适当的错误信息
- 认证令牌（Authorization头）的添加逻辑必须保持不变
- FormData上传（uploadAsset方法）的处理必须保持不变

**Scope:**
所有返回有效JSON响应的API请求应该完全不受此修复影响。这包括：
- 成功的API调用（HTTP 2xx + JSON响应）
- JSON格式的错误响应（HTTP 4xx/5xx + JSON响应）
- 所有现有的认证、上传、资源管理功能

## Hypothesized Root Cause

基于bug描述和代码分析，最可能的问题是：

1. **无条件JSON解析**: `request` 方法在第47行无条件调用 `response.json()`，没有检查响应的Content-Type或验证响应体是否为有效JSON

2. **错误信息丢失**: catch块在第58行捕获JSON解析错误后，返回通用的 "Network error" 或 `error.message`，但此时响应体已经被 `response.json()` 消费，无法再次读取实际的错误内容

3. **缺少Content-Type检查**: 代码假设所有响应都是JSON格式，没有处理后端服务故障时可能返回的纯文本或HTML错误页面

4. **Response Body流的单次读取限制**: Fetch API的Response.body是一个流，只能读取一次。一旦 `response.json()` 被调用，即使失败，响应体也已被消费，无法在catch块中再次读取

## Correctness Properties

Property 1: Fault Condition - 非JSON响应的优雅处理

_For any_ HTTP响应，如果Content-Type不是application/json或响应体不是有效JSON，修复后的request方法 SHALL 将响应体作为纯文本读取，并返回包含原始错误内容的标准ApiResponse格式 `{ success: false, error: <actual_text_content> }`，而不是抛出JSON解析错误或返回通用的 "Network error"。

**Validates: Requirements 2.1, 2.2, 2.3, 2.4**

Property 2: Preservation - JSON响应处理保持不变

_For any_ HTTP响应，如果Content-Type是application/json且响应体是有效JSON，修复后的request方法 SHALL 产生与原始方法完全相同的行为，包括成功响应的数据提取、JSON错误响应的错误信息提取、以及所有认证和请求头处理。

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**

## Fix Implementation

### Changes Required

假设我们的根因分析正确：

**File**: `app/src/services/api.ts`

**Function**: `request` (私有方法，第36-61行)

**Specific Changes**:

1. **添加Content-Type检查**: 在调用 `response.json()` 前，检查响应头的Content-Type
   - 获取 `response.headers.get('content-type')`
   - 检查是否包含 'application/json'

2. **条件性响应解析**: 根据Content-Type选择解析方法
   - 如果是JSON: 调用 `response.json()`
   - 如果不是JSON: 调用 `response.text()`

3. **纯文本响应包装**: 将纯文本响应包装成标准ApiResponse格式
   - 对于非2xx状态码: 返回 `{ success: false, error: textContent }`
   - 对于2xx状态码: 尝试解析为JSON，失败则返回文本

4. **增强catch块错误处理**: 在catch块中尝试读取响应文本
   - 注意：由于Response.body只能读取一次，需要在try块中克隆响应或提前读取
   - 或者在catch块中检查错误类型，如果是JSON解析错误，提供更有意义的错误信息

5. **保持向后兼容**: 确保所有现有的JSON响应处理逻辑不受影响
   - 成功的JSON响应继续返回 `data`
   - JSON错误响应继续提取 `error` 字段
   - 认证头、FormData上传等功能保持不变

### Implementation Approach

推荐的实现方式：

```typescript
private async request<T>(
  endpoint: string,
  options?: RequestInit
): Promise<ApiResponse<T>> {
  // ... 现有的headers设置代码 ...

  try {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      ...options,
      headers,
    })

    // 检查Content-Type
    const contentType = response.headers.get('content-type')
    const isJson = contentType?.includes('application/json')

    let data: any

    if (isJson) {
      // JSON响应 - 使用现有逻辑
      data = await response.json()
    } else {
      // 非JSON响应 - 读取为文本
      const text = await response.text()
      // 包装成ApiResponse格式
      data = { error: text || 'Empty response' }
    }

    if (!response.ok) {
      return {
        success: false,
        error: data.error || 'Request failed',
      }
    }

    return data
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error',
    }
  }
}
```

## Testing Strategy

### Validation Approach

测试策略采用两阶段方法：首先在未修复的代码上运行探索性测试以确认bug和根因，然后验证修复后的代码正确处理非JSON响应并保持现有JSON响应的行为不变。

### Exploratory Fault Condition Checking

**Goal**: 在实施修复前，在未修复的代码上运行测试以展示bug。确认或反驳根因分析。如果反驳，需要重新假设根因。

**Test Plan**: 编写测试模拟后端返回非JSON响应（纯文本、HTML等），并断言当前代码会抛出JSON解析错误或返回通用错误信息。在未修复的代码上运行这些测试以观察失败并理解根因。

**Test Cases**:
1. **纯文本错误响应测试**: 模拟后端返回 "A server error occurred" (Content-Type: text/plain)
   - 在未修复代码上会失败：抛出JSON解析错误
   - 期望看到：`SyntaxError: Unexpected token 'A'...`

2. **HTML错误页面测试**: 模拟后端返回HTML错误页面 (Content-Type: text/html)
   - 在未修复代码上会失败：抛出JSON解析错误
   - 期望看到：返回 "Network error"，丢失实际HTML内容

3. **空响应体测试**: 模拟后端返回空响应 (Content-Type: text/plain, body: "")
   - 在未修复代码上会失败：抛出JSON解析错误
   - 期望看到：`SyntaxError: Unexpected end of JSON input`

4. **错误Content-Type但有效JSON测试**: 模拟后端返回有效JSON但Content-Type为text/plain
   - 在未修复代码上可能失败：取决于实现
   - 期望看到：如果严格检查Content-Type，应该能处理这种边缘情况

**Expected Counterexamples**:
- JSON解析错误被抛出，错误信息类似 "Unexpected token" 或 "Unexpected end of JSON input"
- 可能的原因：无条件调用 `response.json()`，没有Content-Type检查，Response.body流的单次读取限制

### Fix Checking

**Goal**: 验证对于所有触发bug条件的输入，修复后的函数产生期望的行为。

**Pseudocode:**
```
FOR ALL response WHERE isBugCondition(response) DO
  result := request_fixed(endpoint, options)
  ASSERT result.success = false
  ASSERT result.error CONTAINS actual_response_text
  ASSERT result.error NOT EQUALS "Network error" (unless actual network error)
END FOR
```

### Preservation Checking

**Goal**: 验证对于所有不触发bug条件的输入，修复后的函数产生与原始函数相同的结果。

**Pseudocode:**
```
FOR ALL response WHERE NOT isBugCondition(response) DO
  ASSERT request_original(endpoint, options) = request_fixed(endpoint, options)
END FOR
```

**Testing Approach**: 推荐使用基于属性的测试进行保留性检查，因为：
- 它自动生成大量测试用例覆盖输入域
- 它能捕获手动单元测试可能遗漏的边缘情况
- 它提供强有力的保证，确保所有非bug输入的行为保持不变

**Test Plan**: 首先在未修复的代码上观察JSON响应的行为，然后编写基于属性的测试捕获该行为。

**Test Cases**:
1. **成功JSON响应保留**: 观察未修复代码正确处理HTTP 200 + JSON响应，然后编写测试验证修复后继续工作
2. **JSON错误响应保留**: 观察未修复代码正确提取JSON错误信息，然后编写测试验证修复后继续工作
3. **认证头保留**: 观察未修复代码正确添加Authorization头，然后编写测试验证修复后继续工作
4. **FormData上传保留**: 观察uploadAsset方法正确处理文件上传，然后编写测试验证修复后继续工作

### Unit Tests

- 测试非JSON响应（纯文本、HTML、空响应）的处理
- 测试JSON响应的处理保持不变
- 测试边缘情况（错误的Content-Type但有效JSON）
- 测试网络错误的处理
- 测试认证头的添加
- 测试不同HTTP状态码的处理

### Property-Based Tests

- 生成随机的响应Content-Type和响应体，验证修复后的代码不会抛出未捕获的异常
- 生成随机的有效JSON响应，验证保留性（行为与原始代码相同）
- 生成随机的非JSON响应，验证正确性（返回包含实际内容的错误信息）

### Integration Tests

- 测试完整的API调用流程（健康检查、登录、资源获取等）
- 测试后端服务故障场景（返回纯文本错误）
- 测试维护模式页面能够显示实际的后端错误信息
- 测试从错误状态恢复（后端恢复后，前端能够正常工作）
