'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

export default function CollectPage() {
  const { data: session } = useSession()
  const [imageUrl, setImageUrl] = useState('')
  const [title, setTitle] = useState('')
  const [tags, setTags] = useState('')
  const [folderId, setFolderId] = useState<string | null>(null)
  const [folders, setFolders] = useState<{id: string, name: string}[]>([])
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    const fetchFolders = async () => {
      if (!session?.user?.id) return
      const res = await fetch(`/api/folders?userId=${session.user.id}`)
      const result = await res.json()
      if (result.success) setFolders(result.data.map((f: any) => ({ id: f.id, name: f.name })))
    }
    fetchFolders()
  }, [session?.user?.id])

  const bookmarklet = `javascript:(function(){var u=prompt('输入图片地址'); if(!u) return; fetch('${typeof window !== 'undefined' ? window.location.origin : ''}/api/collect',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({imageUrl:u})}).then(r=>r.json()).then(x=>{alert(x.success?'采集成功':'采集失败: '+x.message)}).catch(e=>alert('采集失败: '+e.message));})();`

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
      setImageUrl('')
      setTitle('')
      setTags('')
      setFolderId(null)
    } catch (e: any) {
      setMessage(e.message || '采集失败')
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">采集 Bookmarklet</h1>
      <p className="text-sm text-gray-600 mb-4">将下面的链接拖到浏览器书签栏，即可在任何页面一键采集图片 URL 到素材库。</p>
      <a className="inline-block px-3 py-2 rounded bg-black text-white text-sm mb-6" href={bookmarklet}>拖我到书签栏</a>

      <h2 className="text-xl font-semibold mb-3">手动采集</h2>
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
