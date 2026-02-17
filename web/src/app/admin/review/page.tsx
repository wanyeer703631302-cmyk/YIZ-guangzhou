'use client'

import { useEffect, useState } from 'react'

interface Asset {
  id: string
  title: string | null
  storageUrl: string
  thumbnailUrl: string | null
  status: 'pending' | 'approved' | 'rejected'
}

export default function ReviewPage() {
  const [assets, setAssets] = useState<Asset[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchPending = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/assets?status=pending&page=1&limit=50')
      const result = await res.json()
      if (!result.success) throw new Error(result.message)
      setAssets(result.data.items)
    } catch (e: any) {
      setError(e.message || '获取待审核失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchPending() }, [])

  const review = async (assetId: string, status: 'approved' | 'rejected') => {
    try {
      const res = await fetch('/api/assets/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assetId, status })
      })
      const result = await res.json()
      if (!result.success) throw new Error(result.message)
      await fetchPending()
    } catch (e: any) {
      alert(e.message || '审核失败')
    }
  }

  const addVersion = async (assetId: string) => {
    const url = prompt('输入版本图片 URL')
    if (!url) return
    try {
      const res = await fetch('/api/assets/version', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assetId, sourceUrl: url })
      })
      const result = await res.json()
      if (!result.success) throw new Error(result.message)
      alert('版本创建成功')
    } catch (e: any) {
      alert(e.message || '版本创建失败')
    }
  }

  if (loading) return <div className="p-6 text-gray-600">加载中...</div>
  if (error) return <div className="p-6 text-red-600">{error}</div>

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-bold">素材审核与版本管理</h1>
      {assets.length === 0 ? (
        <div className="text-gray-500">暂无待审核素材</div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {assets.map(a => (
            <div key={a.id} className="p-3 rounded bg-gray-100">
              <img src={a.thumbnailUrl || a.storageUrl} alt={a.title || ''} className="w-full h-auto rounded" />
              <div className="mt-2 text-sm font-medium">{a.title || '未命名'}</div>
              <div className="mt-2 flex gap-2">
                <button onClick={() => review(a.id, 'approved')} className="px-3 py-1 rounded bg-green-600 text-white text-sm">通过</button>
                <button onClick={() => review(a.id, 'rejected')} className="px-3 py-1 rounded bg-red-600 text-white text-sm">拒绝</button>
                <button onClick={() => addVersion(a.id)} className="px-3 py-1 rounded bg-gray-800 text-white text-sm">加版本</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
