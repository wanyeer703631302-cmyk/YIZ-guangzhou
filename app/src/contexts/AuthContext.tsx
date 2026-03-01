import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { apiClient } from '../services/api'
import type { User } from '../types/api'

interface AuthContextType {
  user: User | null
  loading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  register: (email: string, password: string, name: string) => Promise<{ success: boolean; error?: string }>
  logout: () => void
  refreshSession: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  // 验证会话
  const validateSession = async () => {
    const token = localStorage.getItem('auth_token')
    
    if (!token) {
      setLoading(false)
      return
    }

    try {
      const response = await apiClient.getSession()
      
      if (response.success && response.data) {
        setUser(response.data.user)
      } else {
        // 会话无效，清除令牌
        localStorage.removeItem('auth_token')
        setUser(null)
      }
    } catch (error) {
      console.error('Session validation error:', error)
      localStorage.removeItem('auth_token')
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  // 应用启动时验证会话
  useEffect(() => {
    validateSession()
  }, [])

  // 登录方法
  const login = async (email: string, password: string) => {
    try {
      const response = await apiClient.login(email, password)
      
      if (response.success && response.data) {
        setUser(response.data.user)
        return { success: true }
      } else {
        return {
          success: false,
          error: response.error || '登录失败'
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '网络错误'
      }
    }
  }

  // 注册方法
  const register = async (email: string, password: string, name: string) => {
    try {
      const response = await apiClient.register(email, password, name)
      
      if (response.success && response.data) {
        setUser(response.data.user)
        return { success: true }
      } else {
        return {
          success: false,
          error: response.error || '注册失败'
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '网络错误'
      }
    }
  }

  // 登出方法
  const logout = () => {
    apiClient.logout()
    setUser(null)
  }

  // 刷新会话方法
  const refreshSession = async () => {
    await validateSession()
  }

  const value: AuthContextType = {
    user,
    loading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    refreshSession,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// 自定义Hook用于使用认证上下文
export function useAuth() {
  const context = useContext(AuthContext)
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  
  return context
}
