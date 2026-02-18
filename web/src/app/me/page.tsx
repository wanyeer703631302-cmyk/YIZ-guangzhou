'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import Image from 'next/image'
import { MasonryGrid } from '@/components/MasonryGrid'

interface MessageItem {
  assetId: string
  assetTitle: string | null
  assetThumb: string
  giverId?: string
  giverName?: string
  giverAvatar?: string | null
  level: string
  time?: string
}

export default function MePage() {
  const { data: session, status } = useSession()
  const [tab, setTab] = useState<'mine'|'favorites'|'profile'|'messages'>('mine')
  const [favorites, setFavorites] = useState<any[]>([])
  const [messages, setMessages] = useState<MessageItem[]>([])
  const [bio, setBio] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [savedMsg, setSavedMsg] = useState<string | null>(null)

  useEffect(() => {
    if (status === 'authenticated') {
      setBio((session?.user as any)?.bio || '')
      setAvatarUrl((session?.user as any)?.image || '')
    }
  }, [status, session?.user])

  useEffect(() => {
    if (tab === 'favorites') {
      fetch('/api/favorites?page=1&limit=40')
        .then(r => r.json())
        .then(res => { if (res.success) setFavorites(res.data.items || []) })
        .catch(() => {})
    } else if (tab === 'messages') {
      fetch('/api/levels/messages?page=1&limit=40')
        .then(r => r.json())
        .then(res => { if (res.success) setMessages(res.data.items || []) })
        .catch(() => {})
    }
  }, [tab])

  if (status === 'loading') return <div className="p-6">加载中...</div>
  if (!session) redirect('/login')

  const saveProfile = async () => {
    setSavedMsg(null)
    try {
      const res = await fetch('/api/users/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bio, avatarUrl })
      })
      const result = await res.json()
      if (!result.success) throw new Error(result.message)
      setSavedMsg('保存成功')
    } catch (e: any) {
      setSavedMsg(e.message || '保存失败')
    }
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">个人页面</h1>

      <div className="flex gap-2 mb-4">
        {['mine','favorites','profile','messages'].map(k => (
          <button
            key={k}
            onClick={()=>setTab(k as any)}
            className={`px-3 py-1.5 rounded-full text-sm ${tab===k ? 'bg-black text-white' : 'bg-gray-100 text-gray-700'}`}
          >
            {k==='mine'?'我的图片':k==='favorites'?'我的收藏':k==='profile'?'头像与信息':'消息'}
          </button>
        ))}
      </div>

      {tab==='mine' && (
        <MasonryGrid
          userId={(session.user as any).id}
          folderId={null}
          searchQuery=""
          viewMode="grid"
          likedOnly={false}
        />
      )}

      {tab==='favorites' && (
        favorites.length === 0 ? <div className="text-gray-500">暂无收藏</div> : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {favorites.map((f: any) => (
              <div key={f.assetId} className="rounded-xl overflow-hidden bg-gray-100">
                <Image
                  src={f.asset.thumbnailUrl || f.asset.storageUrl}
                  alt={f.asset.title || ''}
                  width={400}
                  height={300}
                  className="w-full h-auto object-cover"
                />
              </div>
            ))}
          </div>
        )
      )}

      {tab==='profile' && (
        <div className="space-y-3 max-w-md">
          <div>
            <label className="block text-sm mb-1">头像地址</label>
            <input value={avatarUrl} onChange={(e)=>setAvatarUrl(e.target.value)} className="w-full px-3 py-2 border rounded" />
          </div>
          <div>
            <label className="block text-sm mb-1">个人简介</label>
            <textarea value={bio} onChange={(e)=>setBio(e.target.value)} className="w-full px-3 py-2 border rounded" rows={4} />
          </div>
          <button onClick={saveProfile} className="px-4 py-2 bg-black text-white rounded">保存</button>
          {savedMsg && <p className="text-sm text-gray-700">{savedMsg}</p>}
        </div>
      )}

      {tab==='messages' && (
        messages.length === 0 ? <div className="text-gray-500">暂无消息</div> : (
          <div className="space-y-3">
            {messages.map((m, idx) => {
              const key = `msg:${m.assetId}:${m.giverId || ''}:${m.level}:${m.time || ''}`
              const read = typeof window !== 'undefined' && !!localStorage.getItem(key)
              return (
                <div key={idx} className={`flex items-center gap-3 p-3 rounded border ${read ? 'bg-white border-gray-200' : 'bg-blue-50 border-blue-200'}`}>
                  {m.giverAvatar ? <Image src={m.giverAvatar} alt={m.giverName || ''} width={32} height={32} className="rounded-full" /> : <div className="w-8 h-8 rounded-full bg-gray-200" />}
                  <div className="flex-1">
                    <div className="text-sm text-gray-700">
                      <span className="font-medium">{m.giverName || '某人'}</span> 给你一个 {m.level}
                    </div>
                    {m.time && <div className="text-xs text-gray-500 mt-1">{new Date(m.time).toLocaleString()}</div>}
                  </div>
                  {!read && (
                    <button
                      className="px-2 py-1 text-xs bg-black text-white rounded"
                      onClick={() => { if (typeof window !== 'undefined') localStorage.setItem(key, '1') }}
                    >
                      已读
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )
      )}
    </div>
  )
}
