export type UserRole = 'ADMIN' | 'USER'

export type AuditAction =
  | 'USER_CREATED'
  | 'USER_UPDATED'
  | 'USER_DELETED'
  | 'USER_ROLE_CHANGED'
  | 'USER_PASSWORD_RESET'
  | 'USER_PASSWORD_CHANGED'
  | 'USER_LOGIN'
  | 'USER_LOGOUT'

export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateUserRequest {
  email: string
  name: string
  role: UserRole
}

export interface CreateUserResponse {
  user: User
  temporaryPassword: string
}

export interface UpdateUserRequest {
  name?: string
  role?: UserRole
  resetPassword?: boolean
}

export interface UpdateUserResponse {
  user: User
  temporaryPassword?: string
}

export interface UserListResponse {
  users: User[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface AuditLog {
  id: string
  action: AuditAction
  performedById: string
  targetUserId?: string
  details?: any
  ipAddress?: string
  userAgent?: string
  createdAt: string
  performedBy: {
    id: string
    email: string
    name: string
  }
  targetUser?: {
    id: string
    email: string
    name: string
  }
}

export interface AuditLogListResponse {
  logs: AuditLog[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface PasswordChangeRequest {
  currentPassword: string
  newPassword: string
  isForceChange?: boolean
}
