'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useSearchParams } from 'next/navigation'

export default function CollectPage() {
  const { data: session } = useSession()
  const searchParams = useSearchParams()
  const [imageUrl, setImageUrl] = useState('')
  const [title, setTitle] = useState('')
  const [tags, setTags] = useState('')
  const [folderId, setFolderId] = useState<string | null>(null)
  const [folders, setFolders] = useState<{id: string, name: string}[]>([])
  const [message, setMessage] = useState<string | null>(null)
  const autoCollectRef = useRef(false)
  const [embedMode, setEmbedMode] = useState(false)

  useEffect(() => {
    const fetchFolders = async () => {
      if (!session?.user?.id) return
      const res = await fetch('/api/folders')
      const result = await res.json()
      if (result.success) setFolders(result.data.map((f: any) => ({ id: f.id, name: f.name })))
    }
    fetchFolders()
  }, [session?.user?.id])

  useEffect(() => {
    const url = searchParams.get('imageUrl')
    if (url) setImageUrl(url)
    const embed = searchParams.get('embed')
    setEmbedMode(embed === '1' || embed === 'true')
  }, [searchParams])

  const handleCollect = async () => {
    setMessage(null)
    try {
      const res = await fetch('/api/collect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl, title, tags, folderId })
      })
      const result = await res.json()
      if (!result.success) throw new Error(result.message)
      setMessage('采集成功')
      if (embedMode && typeof window !== 'undefined') {
        window.parent?.postMessage({ type: 'pincollect:collect-success', assetId: result.data?.id }, '*')
      }
      setImageUrl('')
      setTitle('')
      setTags('')
      setFolderId(null)
    } catch (e: any) {
      setMessage(e.message || '采集失败')
    }
  }

  useEffect(() => {
    const url = searchParams.get('imageUrl')
    const auto = searchParams.get('auto')
    if (url && auto === '1' && session?.user?.id && !autoCollectRef.current) {
      autoCollectRef.current = true
      handleCollect()
    }
  }, [searchParams, session?.user?.id])

  return (
    <div className="max-w-2xl mx-auto p-6">
      {!embedMode && (
        <>
          <h1 className="text-2xl font-bold mb-4">采集入口</h1>
          <p className="text-sm text-gray-600 mb-6">使用浏览器扩展在外部网站点击图片即可自动带入到此页面。</p>
        </>
      )}

      <h2 className="text-xl font-semibold mb-3">采集确认</h2>
      <div className="space-y-3">
        <input value={imageUrl} onChange={(e)=>setImageUrl(e.target.value)} placeholder="图片 URL" className="w-full px-3 py-2 border rounded" />
        <input value={title} onChange={(e)=>setTitle(e.target.value)} placeholder="标题（可选）" className="w-full px-3 py-2 border rounded" />
        <input value={tags} onChange={(e)=>setTags(e.target.value)} placeholder="标签（用逗号分隔，可选）" className="w-full px-3 py-2 border rounded" />
        <select value={folderId || ''} onChange={(e)=>setFolderId(e.target.value || null)} className="w-full px-3 py-2 border rounded">
          <option value="">不分类</option>
          {folders.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
        </select>
        <button onClick={handleCollect} className="px-4 py-2 bg-black text-white rounded">采集</button>
        {message && <p className="text-sm text-gray-700">{message}</p>}
      </div>
    </div>
  )
}
