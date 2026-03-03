import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

interface AdminRouteProps {
  children: React.ReactNode
}

/**
 * 管理员路由保护组件
 * 只允许管理员访问的路由
 */
export function AdminRoute({ children }: AdminRouteProps) {
  const { user, isAuthenticated } = useAuth()

  // 未登录，重定向到登录页
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  // 不是管理员，重定向到首页
  if (user?.role !== 'ADMIN') {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}
