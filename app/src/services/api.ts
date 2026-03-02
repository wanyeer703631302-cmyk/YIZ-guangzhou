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

      // 检查Content-Type以确定如何解析响应
      const contentType = response.headers.get('content-type')
      const isJson = contentType?.includes('application/json')

      let data: any

      if (isJson) {
        // JSON响应 - 使用现有逻辑
        data = await response.json()
      } else {
        // 非JSON响应 - 先读取为文本
        const text = await response.text()
        
        // 尝试解析为JSON（处理Content-Type错误但内容是JSON的情况）
        try {
          data = JSON.parse(text)
        } catch {
          // 如果不是有效JSON，包装成ApiResponse格式
          data = { error: text || 'Empty response' }
        }
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

  // ==================== 资源管理 ====================

  /**
   * 获取资源列表
   * 支持分页和文件夹筛选
   */
  async getAssets(
    params?: AssetsQueryParams
  ): Promise<ApiResponse<AssetsListData>> {
    // 演示模式：如果使用演示账号，返回演示数据
    if (this.token?.startsWith('demo-token-')) {
      // 从 localStorage 获取演示上传的图片
      const demoAssets = JSON.parse(localStorage.getItem('demo_assets') || '[]')
      
      return {
        success: true,
        data: {
          items: demoAssets,
          total: demoAssets.length,
          page: 1,
          limit: 50
        }
      }
    }

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
    console.log('uploadAsset 调用, token:', this.token)
    
    // 演示模式：如果使用演示账号，模拟上传成功
    if (this.token?.startsWith('demo-token-')) {
      console.log('使用演示模式上传')
      // 模拟上传延迟
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // 创建本地预览URL
      const previewUrl = URL.createObjectURL(file)
      
      const demoAsset: Asset = {
        id: 'demo-asset-' + Date.now(),
        title: metadata?.title || file.name,
        url: previewUrl,
        thumbnailUrl: previewUrl,
        size: file.size,
        folderId: metadata?.folderId || null,
        userId: 'demo-user-id',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      
      // 保存到 localStorage
      const demoAssets = JSON.parse(localStorage.getItem('demo_assets') || '[]')
      demoAssets.unshift(demoAsset) // 添加到开头
      localStorage.setItem('demo_assets', JSON.stringify(demoAssets))
      
      console.log('演示模式上传成功:', demoAsset)
      return {
        success: true,
        data: demoAsset
      }
    }

    console.log('使用真实 API 上传')

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

      // 检查Content-Type以确定如何解析响应
      const contentType = response.headers.get('content-type')
      const isJson = contentType?.includes('application/json')

      let data: any

      if (isJson) {
        data = await response.json()
      } else {
        // 非JSON响应 - 先读取为文本
        const text = await response.text()
        
        // 尝试解析为JSON
        try {
          data = JSON.parse(text)
        } catch {
          // 如果不是有效JSON，包装成错误响应
          data = {
            success: false,
            error: text || `上传失败 (HTTP ${response.status})`
          }
        }
      }

      if (!response.ok) {
        return {
          success: false,
          error: data.error || `上传失败 (HTTP ${response.status})`,
        }
      }

      return data
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '上传失败',
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
    // 演示模式：允许使用演示账号直接登录
    if (email === 'demo@yiz.com' && password === 'demo123') {
      const demoAuthData: AuthData = {
        token: 'demo-token-' + Date.now(),
        user: {
          id: 'demo-user-id',
          email: 'demo@yiz.com',
          name: '演示用户',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
      }
      
      this.token = demoAuthData.token
      localStorage.setItem('auth_token', demoAuthData.token)
      
      return {
        success: true,
        data: demoAuthData
      }
    }

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
    // 演示模式：如果是演示令牌，返回演示用户信息
    if (this.token?.startsWith('demo-token-')) {
      return {
        success: true,
        data: {
          user: {
            id: 'demo-user-id',
            email: 'demo@yiz.com',
            name: '演示用户',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }
        }
      }
    }

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
    return this.request('/health-fast')
  }
}

/**
 * 导出API客户端单例
 */
export const apiClient = new ApiClient()
