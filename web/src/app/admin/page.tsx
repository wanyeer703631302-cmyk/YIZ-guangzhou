'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'

export default function AdminHomePage() {
  const { data: session, status } = useSession()
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [users, setUsers] = useState<any[]>([])
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [userSearch, setUserSearch] = useState('')

  useEffect(() => {
    if (status === 'authenticated') {
      const role = (session?.user as any)?.role
      if (role !== 'admin') redirect('/')
    }
  }, [status, session?.user])

  const fetchUsers = async () => {
    try {
      setLoadingUsers(true)
      const res = await fetch(`/api/admin/users?search=${userSearch}`)
      const result = await res.json()
      if (result.success) {
        setUsers(result.data.items)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoadingUsers(false)
    }
  }

  useEffect(() => {
    if (status === 'authenticated') {
      fetchUsers()
    }
  }, [status, userSearch])

  if (status === 'loading') {
    return <div className="p-6">加载中...</div>
  }
  if (!session) redirect('/login')

  const createUser = async () => {
    setMessage(null)
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, username, password })
      })
      const result = await res.json()
      if (!result.success) throw new Error(result.message)
      setMessage('创建成功')
      setEmail(''); setUsername(''); setPassword('')
    } catch (e: any) {
      setMessage(e.message || '创建失败')
    }
  }



  const toggleUserDisplay = async (userId: string, currentStatus: boolean) => {
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userIds: [userId],
          isDisplayed: !currentStatus
        })
      })
      const result = await res.json()
      if (result.success) {
        setUsers(users.map(u => 
          u.id === userId ? { ...u, isDisplayed: !currentStatus } : u
        ))
      }
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8">
      <h1 className="text-2xl font-bold">管理员中心</h1>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">管理面板</h2>
        <div className="flex gap-3">
          <a href="/stats" className="px-4 py-2 bg-black text-white rounded">统计仪表盘</a>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">用户展示管理</h2>
          <input
            value={userSearch}
            onChange={(e) => setUserSearch(e.target.value)}
            placeholder="搜索用户..."
            className="px-3 py-1.5 border rounded text-sm w-64"
          />
        </div>
        
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-700 font-medium">
              <tr>
                <th className="px-4 py-3">用户</th>
                <th className="px-4 py-3">邮箱</th>
                <th className="px-4 py-3">角色</th>
                <th className="px-4 py-3 text-center">首页展示</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loadingUsers ? (
                <tr><td colSpan={4} className="p-4 text-center text-gray-500">加载中...</td></tr>
              ) : users.map(user => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{user.username}</td>
                  <td className="px-4 py-3 text-gray-500">{user.email}</td>
                  <td className="px-4 py-3 text-gray-500">{user.role}</td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => toggleUserDisplay(user.id, user.isDisplayed)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        user.isDisplayed ? 'bg-black' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          user.isDisplayed ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">生成账号</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="邮箱" className="px-3 py-2 border rounded" />
          <input value={username} onChange={(e)=>setUsername(e.target.value)} placeholder="用户名" className="px-3 py-2 border rounded" />
          <input value={password} onChange={(e)=>setPassword(e.target.value)} placeholder="初始密码" className="px-3 py-2 border rounded" />
        </div>
        <button onClick={createUser} className="px-4 py-2 bg-black text-white rounded">创建</button>
        {message && <p className="text-sm text-gray-700">{message}</p>}
      </section>
    </div>
  )
}
