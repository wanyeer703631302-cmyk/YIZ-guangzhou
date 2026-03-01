# 前端服务层

本目录包含前端应用的服务层代码，负责与后端API通信。

## 文件说明

### `api.ts`

API客户端模块，封装所有后端API调用。

**主要功能:**

- **资源管理**: 获取资源列表、上传图片
- **用户认证**: 登录、注册、会话验证、登出
- **交互功能**: 点赞、收藏的创建和删除
- **健康检查**: 检查后端服务状态

**使用示例:**

```typescript
import { apiClient } from './services/api'

// 获取资源列表
const result = await apiClient.getAssets({ page: 1, limit: 20 })
if (result.success) {
  console.log(result.data.items)
}

// 用户登录
const loginResult = await apiClient.login('user@example.com', 'password')
if (loginResult.success) {
  console.log('登录成功', loginResult.data.user)
}

// 创建点赞
const likeResult = await apiClient.createLike('asset-id')
```

## API响应格式

所有API方法返回统一的响应格式：

```typescript
interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}
```

## 认证机制

- 登录/注册成功后，JWT令牌自动存储到 `localStorage`
- 所有需要认证的请求自动添加 `Authorization` 头
- 调用 `logout()` 方法清除本地令牌

## 错误处理

API客户端自动处理以下错误：

- 网络错误
- HTTP错误状态码
- JSON解析错误

所有错误都会返回标准化的错误响应，包含 `success: false` 和 `error` 消息。
