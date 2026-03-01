/**
 * API相关类型定义
 * 用于前后端数据交互
 */

/**
 * 用户信息
 */
export interface User {
  id: string
  email: string
  name: string
  createdAt: string
  updatedAt: string
}

/**
 * 资源（图片）信息
 */
export interface Asset {
  id: string
  title: string
  url: string
  thumbnailUrl: string
  size: number
  folderId: string | null
  userId: string
  createdAt: string
  updatedAt: string
  tags?: Tag[]
  likesCount?: number
  favoritesCount?: number
  isLiked?: boolean
  isFavorited?: boolean
}

/**
 * 文件夹信息
 */
export interface Folder {
  id: string
  name: string
  userId: string
  createdAt: string
  updatedAt: string
}

/**
 * 标签信息
 */
export interface Tag {
  id: string
  name: string
  createdAt: string
}

/**
 * 点赞记录
 */
export interface Like {
  id: string
  assetId: string
  userId: string
  createdAt: string
}

/**
 * 收藏记录
 */
export interface Favorite {
  id: string
  assetId: string
  userId: string
  createdAt: string
}

/**
 * API响应通用格式
 */
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

/**
 * 资源列表响应数据
 */
export interface AssetsListData {
  items: Asset[]
  total: number
  page: number
  limit: number
}

/**
 * 用户交互数据
 */
export interface UserInteractionsData {
  likes: Like[]
  favorites: Favorite[]
}

/**
 * 认证响应数据
 */
export interface AuthData {
  user: User
  token: string
}

/**
 * 健康检查响应数据
 */
export interface HealthData {
  status: 'ok' | 'error'
  services: {
    database: 'connected' | 'disconnected'
    cloudinary: 'configured' | 'not configured'
  }
  timestamp: string
  message?: string
}

/**
 * 资源查询参数
 */
export interface AssetsQueryParams {
  folderId?: string
  page?: number
  limit?: number
}

/**
 * 上传元数据
 */
export interface UploadMetadata {
  title?: string
  folderId?: string
  tags?: string[]
}
