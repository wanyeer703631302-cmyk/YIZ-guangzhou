'use client'

import { useEffect, useState } from 'react'

interface StatsData {
  totals: { assets: number, users: number, tags: number }
  uploadsLast7Days: { date: string, count: number }[]
  topTags: { id: string, name: string, count: number }[]
  activeUsers: { id: string, name: string, avatar: string | null, count: number }[]
}

export default function StatsPage() {
  const [data, setData] = useState<StatsData | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/stats')
        const result = await res.json()
        if (!result.success) throw new Error(result.message)
        setData(result.data)
      } catch (e: any) {
        setError(e.message || '获取统计失败')
      }
    }
    fetchStats()
  }, [])

  if (error) return <div className="p-6 text-red-600">{error}</div>
  if (!data) return <div className="p-6 text-gray-600">加载中...</div>

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">统计仪表盘</h1>

      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 rounded bg-gray-100">
          <div className="text-sm text-gray-500">素材总数</div>
          <div className="text-2xl font-semibold">{data.totals.assets}</div>
        </div>
        <div className="p-4 rounded bg-gray-100">
          <div className="text-sm text-gray-500">用户总数</div>
          <div className="text-2xl font-semibold">{data.totals.users}</div>
        </div>
        <div className="p-4 rounded bg-gray-100">
          <div className="text-sm text-gray-500">标签总数</div>
          <div className="text-2xl font-semibold">{data.totals.tags}</div>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-2">近 7 天上传</h2>
        <div className="grid grid-cols-7 gap-2">
          {data.uploadsLast7Days.map((d, i) => (
            <div key={i} className="p-2 bg-gray-100 rounded text-center">
              <div className="text-xs text-gray-500">{new Date(d.date).toLocaleDateString()}</div>
              <div className="text-lg font-medium">{d.count}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <h2 className="text-xl font-semibold mb-2">热门标签</h2>
          <ul className="space-y-2">
            {data.topTags.map(t => (
              <li key={t.id} className="flex justify-between p-2 bg-gray-100 rounded">
                <span>{t.name}</span>
                <span className="text-gray-600">{t.count}</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="text-xl font-semibold mb-2">活跃用户</h2>
          <ul className="space-y-2">
            {data.activeUsers.map(u => (
              <li key={u.id} className="flex items-center justify-between p-2 bg-gray-100 rounded">
                <div className="flex items-center gap-2">
                  {u.avatar ? <img src={u.avatar} className="w-6 h-6 rounded-full" /> : <div className="w-6 h-6 rounded-full bg-gray-300" />}
                  <span>{u.name}</span>
                </div>
                <span className="text-gray-600">{u.count}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
