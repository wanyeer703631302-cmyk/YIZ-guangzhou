import type {
  User,
  CreateUserRequest,
  CreateUserResponse,
  UpdateUserRequest,
  UpdateUserResponse,
  UserListResponse,
  AuditLogListResponse,
  PasswordChangeRequest,
  AuditAction
} from '../types/admin'

const API_URL = import.meta.env.VITE_API_URL || '/api'

/**
 * 获取认证 token
 */
function getAuthToken(): string | null {
  return localStorage.getItem('token')
}

/**
 * 创建认证请求头
 */
function getAuthHeaders(): HeadersInit {
  const token = getAuthToken()
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` })
  }
}

/**
 * 处理 API 响应
 */
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }))
    throw new Error(error.error || `HTTP ${response.status}`)
  }
  const data = await response.json()
  return data.data
}

/**
 * 创建新用户
 */
export async function createUser(request: CreateUserRequest): Promise<CreateUserResponse> {
  const response = await fetch(`${API_URL}/user/manage`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(request)
  })
  return handleResponse<CreateUserResponse>(response)
}

/**
 * 获取用户列表
 */
export async function getUserList(page: number = 1, limit: number = 50): Promise<UserListResponse> {
  const response = await fetch(`${API_URL}/user/manage?page=${page}&limit=${limit}`, {
    method: 'GET',
    headers: getAuthHeaders()
  })
  return handleResponse<UserListResponse>(response)
}

/**
 * 更新用户信息
 */
export async function updateUser(userId: string, request: UpdateUserRequest): Promise<UpdateUserResponse> {
  const response = await fetch(`${API_URL}/user/manage/${userId}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(request)
  })
  return handleResponse<UpdateUserResponse>(response)
}

/**
 * 删除用户
 */
export async function deleteUser(userId: string): Promise<void> {
  const response = await fetch(`${API_URL}/user/manage/${userId}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  })
  await handleResponse<void>(response)
}

/**
 * 修改密码
 */
export async function changePassword(request: PasswordChangeRequest): Promise<{ token: string }> {
  const response = await fetch(`${API_URL}/user/password`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(request)
  })
  return handleResponse<{ token: string }>(response)
}

/**
 * 获取审计日志
 */
export async function getAuditLogs(params: {
  page?: number
  limit?: number
  action?: AuditAction
  startDate?: string
  endDate?: string
  performedById?: string
  targetUserId?: string
}): Promise<AuditLogListResponse> {
  const queryParams = new URLSearchParams()
  
  if (params.page) queryParams.append('page', params.page.toString())
  if (params.limit) queryParams.append('limit', params.limit.toString())
  if (params.action) queryParams.append('action', params.action)
  if (params.startDate) queryParams.append('startDate', params.startDate)
  if (params.endDate) queryParams.append('endDate', params.endDate)
  if (params.performedById) queryParams.append('performedById', params.performedById)
  if (params.targetUserId) queryParams.append('targetUserId', params.targetUserId)

  const response = await fetch(`${API_URL}/audit/logs?${queryParams.toString()}`, {
    method: 'GET',
    headers: getAuthHeaders()
  })
  return handleResponse<AuditLogListResponse>(response)
}
