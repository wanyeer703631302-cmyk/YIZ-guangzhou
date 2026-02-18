'use client'

import { useState, useEffect } from 'react'
import { useSession, signIn } from 'next-auth/react'
import { useSearchParams } from 'next/navigation'
import { Loader2, Check, AlertCircle } from 'lucide-react'

export default function CollectPage() {
  const { data: session, status } = useSession()
  const searchParams = useSearchParams()
  
  const [imageUrl, setImageUrl] = useState('')
  const [title, setTitle] = useState('')
  const [tags, setTags] = useState('')
  const [folderId, setFolderId] = useState<string>('')
  const [folders, setFolders] = useState<{id: string, name: string}[]>([])
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState<{type: 'success'|'error', text: string} | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') {
      signIn(undefined, { callbackUrl: window.location.href })
    }
  }, [status])

  useEffect(() => {
    const url = searchParams.get('imageUrl')
    if (url) setImageUrl(url)
    
    // Auto-fill title from page title if passed (optional improvement for content.js)
    const pageTitle = searchParams.get('title')
    if (pageTitle) setTitle(pageTitle)
  }, [searchParams])

  useEffect(() => {
    const fetchFolders = async () => {
      if (status !== 'authenticated') return
      try {
        const res = await fetch('/api/folders')
        const result = await res.json()
        if (result.success) {
          setFolders(result.data.map((f: any) => ({ id: f.id, name: f.name })))
        }
      } catch (e) {}
    }
    fetchFolders()
  }, [status])

  const handleCollect = async () => {
    if (!imageUrl) return
    setIsSubmitting(true)
    setMessage(null)
    
    try {
      const res = await fetch('/api/collect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          imageUrl, 
          title: title.trim(), 
          tags: tags.trim(), 
          folderId: folderId || null 
        })
      })
      const result = await res.json()
      
      if (!result.success) throw new Error(result.message)
      
      setMessage({ type: 'success', text: '采集成功！' })
      
      // Auto close after 1.5s
      if (window.opener) {
        setTimeout(() => window.close(), 1500)
      }
    } catch (e: any) {
      setMessage({ type: 'error', text: e.message || '采集失败' })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (status === 'loading') {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    )
  }

  if (!session) return null

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 flex items-center justify-center">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden">
        <div className="p-6">
          <h1 className="text-xl font-bold text-gray-900 mb-6">采集到 YIZ</h1>
          
          <div className="flex gap-4 mb-6">
            <div className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 relative">
              {imageUrl ? (
                <img 
                  src={imageUrl} 
                  alt="Preview" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  无图
                </div>
              )}
            </div>
            <div className="flex-1 space-y-3">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="标题"
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black transition-shadow"
              />
              <select
                value={folderId}
                onChange={(e) => setFolderId(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black transition-shadow appearance-none"
              >
                <option value="">选择收藏夹...</option>
                {folders.map(f => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-4">
            <input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="添加标签 (逗号分隔)..."
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black transition-shadow"
            />
            
            {message && (
              <div className={`p-3 rounded-lg text-sm flex items-center gap-2 ${
                message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
              }`}>
                {message.type === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                {message.text}
              </div>
            )}

            <button
              onClick={handleCollect}
              disabled={isSubmitting || !imageUrl}
              className="w-full py-2.5 bg-black text-white rounded-lg font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {isSubmitting ? '正在采集...' : '确认采集'}
            </button>
            
            <button
              onClick={() => window.close()}
              className="w-full py-2.5 text-gray-500 hover:text-gray-700 text-sm"
            >
              取消
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
