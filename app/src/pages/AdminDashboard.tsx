import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getUserList, getAuditLogs } from '../services/adminApi'
import type { User, AuditLog } from '../types/admin'

export function AdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    adminCount: 0,
    userCount: 0
  })
  const [recentLogs, setRecentLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)

      // 加载用户统计
      const userListResponse = await getUserList(1, 100)
      const users = userListResponse.users
      
      const adminCount = users.filter(u => u.role === 'ADMIN').length
      const userCount = users.filter(u => u.role === 'USER').length

      setStats({
        totalUsers: users.length,
        adminCount,
        userCount
      })

      // 加载最近的审计日志
      const logsResponse = await getAuditLogs({ page: 1, limit: 10 })
      setRecentLogs(logsResponse.logs)
    } catch (error) {
      console.error('Failed to load dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN')
  }

  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      USER_CREATED: '创建用户',
      USER_UPDATED: '更新用户',
      USER_DELETED: '删除用户',
      USER_ROLE_CHANGED: '修改角色',
      USER_PASSWORD_RESET: '重置密码',
      USER_PASSWORD_CHANGED: '修改密码',
      USER_LOGIN: '用户登录',
      USER_LOGOUT: '用户登出'
    }
    return labels[action] || action
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">加载中...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">管理员控制面板</h1>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-gray-500 text-sm font-medium mb-2">总用户数</h3>
          <p className="text-3xl font-bold text-blue-600">{stats.totalUsers}</p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-gray-500 text-sm font-medium mb-2">管理员</h3>
          <p className="text-3xl font-bold text-purple-600">{stats.adminCount}</p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-gray-500 text-sm font-medium mb-2">普通用户</h3>
          <p className="text-3xl font-bold text-green-600">{stats.userCount}</p>
        </div>
      </div>

      {/* 快速操作 */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">快速操作</h2>
        <div className="flex flex-wrap gap-4">
          <Link
            to="/admin/users"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            用户管理
          </Link>
          <Link
            to="/admin/audit-logs"
            className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
          >
            审计日志
          </Link>
        </div>
      </div>

      {/* 最近的审计日志 */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">最近活动</h2>
          <Link
            to="/admin/audit-logs"
            className="text-blue-600 hover:text-blue-700 text-sm"
          >
            查看全部
          </Link>
        </div>
        
        {recentLogs.length === 0 ? (
          <p className="text-gray-500 text-center py-8">暂无活动记录</p>
        ) : (
          <div className="space-y-3">
            {recentLogs.map((log) => (
              <div
                key={log.id}
                className="flex items-center justify-between py-3 border-b last:border-b-0"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{log.performedBy.name}</span>
                    <span className="text-gray-500">{getActionLabel(log.action)}</span>
                    {log.targetUser && (
                      <>
                        <span className="text-gray-500">→</span>
                        <span className="font-medium">{log.targetUser.name}</span>
                      </>
                    )}
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    {formatDate(log.createdAt)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
