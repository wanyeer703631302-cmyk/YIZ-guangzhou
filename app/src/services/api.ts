/**
 * API客户端
 * 封装所有后端API调用
 */

import type {
  ApiResponse,
  Asset,
  AssetsListData,
  AssetsQueryParams,
  AuthData,
  Favorite,
  HealthData,
  Like,
  UploadMetadata,
  User,
  UserInteractionsData,
} from '../types/api'

/**
 * API客户端类
 * 处理所有HTTP请求、认证令牌管理和错误处理
 */
class ApiClient {
  private baseURL: string
  private token: string | null

  constructor() {
    this.baseURL = import.meta.env.VITE_API_URL || '/api'
    this.token = localStorage.getItem('auth_token')
  }

  /**
   * 通用请求方法
   * 处理HTTP请求、添加认证头、错误处理
   */
  private async request<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<ApiResponse<T>> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options?.headers as Record<string, string>),
    }

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`
    }

    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        ...options,
        headers,
      })

      const data = await response.json()

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

  // ==================== 资源管理 ====================

  /**
   * 获取资源列表
   * 支持分页和文件夹筛选
   */
  async getAssets(
    params?: AssetsQueryParams
  ): Promise<ApiResponse<AssetsListData>> {
    const query = new URLSearchParams(params as any).toString()
    return this.request(`/assets?${query}`)
  }

  /**
   * 上传资源
   * 支持文件上传和元数据
   */
  async uploadAsset(
    file: File,
    metadata?: UploadMetadata
  ): Promise<ApiResponse<Asset>> {
    const formData = new FormData()
    formData.append('file', file)
    if (metadata?.title) formData.append('title', metadata.title)
    if (metadata?.folderId) formData.append('folderId', metadata.folderId)
    if (metadata?.tags) formData.append('tags', metadata.tags.join(','))

    try {
      const response = await fetch(`${this.baseURL}/upload`, {
        method: 'POST',
        headers: this.token ? { Authorization: `Bearer ${this.token}` } : {},
        body: formData,
      })

      return await response.json()
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed',
      }
    }
  }

  // ==================== 认证 ====================

  /**
   * 用户登录
   * 成功后自动存储令牌
   */
  async login(
    email: string,
    password: string
  ): Promise<ApiResponse<AuthData>> {
    const response = await this.request<AuthData>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })

    if (response.success && response.data) {
      this.token = response.data.token
      localStorage.setItem('auth_token', response.data.token)
    }

    return response
  }

  /**
   * 用户注册
   * 成功后自动存储令牌
   */
  async register(
    email: string,
    password: string,
    name: string
  ): Promise<ApiResponse<AuthData>> {
    const response = await this.request<AuthData>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    })

    if (response.success && response.data) {
      this.token = response.data.token
      localStorage.setItem('auth_token', response.data.token)
    }

    return response
  }

  /**
   * 获取当前会话
   * 验证令牌是否有效
   */
  async getSession(): Promise<ApiResponse<{ user: User }>> {
    return this.request('/auth/session')
  }

  /**
   * 用户登出
   * 清除本地存储的令牌
   */
  logout() {
    this.token = null
    localStorage.removeItem('auth_token')
  }

  // ==================== 交互功能 ====================

  /**
   * 创建点赞
   */
  async createLike(assetId: string): Promise<ApiResponse<Like>> {
    return this.request('/likes', {
      method: 'POST',
      body: JSON.stringify({ assetId }),
    })
  }

  /**
   * 删除点赞
   */
  async deleteLike(likeId: string): Promise<ApiResponse<void>> {
    return this.request(`/likes/${likeId}`, {
      method: 'DELETE',
    })
  }

  /**
   * 创建收藏
   */
  async createFavorite(assetId: string): Promise<ApiResponse<Favorite>> {
    return this.request('/favorites', {
      method: 'POST',
      body: JSON.stringify({ assetId }),
    })
  }

  /**
   * 删除收藏
   */
  async deleteFavorite(favoriteId: string): Promise<ApiResponse<void>> {
    return this.request(`/favorites/${favoriteId}`, {
      method: 'DELETE',
    })
  }

  /**
   * 获取用户交互数据
   * 返回用户的所有点赞和收藏记录
   */
  async getUserInteractions(): Promise<ApiResponse<UserInteractionsData>> {
    return this.request('/user/interactions')
  }

  // ==================== 健康检查 ====================

  /**
   * 检查后端服务健康状态
   */
  async checkHealth(): Promise<ApiResponse<HealthData>> {
    return this.request('/health')
  }
}

/**
 * 导出API客户端单例
 */
export const apiClient = new ApiClient()
