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

  useEffect(() => {
    if (status === 'authenticated') {
      const role = (session?.user as any)?.role
      if (role !== 'admin') redirect('/')
    }
  }, [status, session?.user])

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

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8">
      <h1 className="text-2xl font-bold">管理员中心</h1>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">管理面板</h2>
        <div className="flex gap-3">
          <a href="/stats" className="px-4 py-2 bg-black text-white rounded">统计仪表盘</a>
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
