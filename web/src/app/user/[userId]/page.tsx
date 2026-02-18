'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import { useSession } from 'next-auth/react'
import { Navbar } from '@/components/Navbar'
import { ProfileTabs } from '@/components/ProfileTabs'
import { MasonryGrid } from '@/components/MasonryGrid'
import { UploadModal } from '@/components/UploadModal'
import { Loader2 } from 'lucide-react'

interface UserProfile {
  id: string
  name: string
  email?: string
  avatarUrl: string | null
  coverUrl: string | null
  isOwner: boolean
  stats: {
    uploads: number
    likes: number
    favorites?: number
  }
  unreadMessages?: number
  image?: string | null
}

export default function UserProfilePage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const { data: session, status } = useSession()
  const userId = params?.userId as string

  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showUpload, setShowUpload] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  // Get active tab from URL or default to 'uploads'
  const activeTab = searchParams?.get('tab') || 'uploads'

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/users/${userId}`)
      const result = await res.json()
      if (!result.success) throw new Error(result.message)
      setProfile(result.data)
    } catch (err: any) {
      setError(err.message || '获取用户失败')
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    if (userId) fetchProfile()
  }, [userId, fetchProfile])

  const handleTabChange = (tab: string) => {
    const newParams = new URLSearchParams(searchParams?.toString())
    newParams.set('tab', tab)
    router.push(`/user/${userId}?${newParams.toString()}`)
  }

  const [messages, setMessages] = useState<any[]>([])
  const [loadingMessages, setLoadingMessages] = useState(false)

  const fetchMessages = useCallback(async () => {
    try {
      setLoadingMessages(true)
      const res = await fetch('/api/user/messages')
      const result = await res.json()
      if (result.success) {
        setMessages(result.data.items)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoadingMessages(false)
    }
  }, [])

  useEffect(() => {
    if (activeTab === 'messages' && profile?.isOwner) {
      fetchMessages()
    }
  }, [activeTab, profile?.isOwner, fetchMessages])

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }


  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    )
  }

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1)
    fetchProfile()
    if (activeTab === 'messages') fetchMessages()
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <div className="text-red-500">{error || '用户不存在'}</div>
        <button onClick={() => router.push('/')} className="px-4 py-2 bg-black text-white rounded-full">
          返回首页
        </button>
      </div>
    )
  }

  // Map tab to sourceType
  const getSourceType = () => {
      switch (activeTab) {
          case 'favorites': return 'favorites'
          case 'likes': return 'likes'
          default: return 'assets'
      }
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar 
        user={session?.user} 
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onUploadClick={() => setShowUpload(true)}
      />

      {/* Cover Image */}
      <div className="h-64 bg-gray-200 relative w-full overflow-hidden">
        {profile.coverUrl ? (
            <Image 
                src={profile.coverUrl} 
                alt="Cover" 
                fill 
                className="object-cover"
                priority
            />
        ) : (
            <div className="w-full h-full bg-gradient-to-r from-gray-200 to-gray-300" />
        )}
      </div>

      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 -mt-16 relative z-10">
        <div className="flex flex-col gap-6">
            {/* User Info Header */}
            <div className="flex items-end gap-6 pb-6">
                <div className="relative w-32 h-32 rounded-full border-4 border-white bg-white overflow-hidden shadow-sm">
                    {profile.avatarUrl || profile.image ? (
                        <Image 
                            src={profile.avatarUrl || profile.image || ''} 
                            alt={profile.name} 
                            fill 
                            className="object-cover"
                        />
                    ) : (
                        <div className="w-full h-full bg-gray-100 flex items-center justify-center text-3xl font-bold text-gray-400">
                            {profile.name?.[0]?.toUpperCase()}
                        </div>
                    )}
                </div>
                <div className="mb-4">
                    <h1 className="text-2xl font-bold text-gray-900">{profile.name}</h1>
                    <div className="flex gap-4 text-sm text-gray-600 mt-1">
                        <span>发布 {profile.stats.uploads}</span>
                        <span>获赞 {profile.stats.likes}</span>
                        {profile.isOwner && <span>被收藏 {profile.stats.favorites || 0}</span>}
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <ProfileTabs 
                activeTab={activeTab} 
                onTabChange={handleTabChange} 
                isOwner={profile.isOwner}
                messageCount={profile.unreadMessages}
            />

            {/* Content Grid */}
            <div className="min-h-[500px] mt-6">
                {activeTab === 'messages' ? (
                    <div className="max-w-4xl mx-auto space-y-4">
                        {loadingMessages ? (
                            <div className="text-center py-12 text-gray-500">加载消息中...</div>
                        ) : messages.length === 0 ? (
                            <div className="text-center py-12 text-gray-500">暂无消息</div>
                        ) : (
                            messages.map((msg) => (
                                <div key={msg.id} className={`p-4 rounded-xl border ${msg.isRead ? 'bg-white border-gray-100' : 'bg-blue-50 border-blue-100'}`}>
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="font-semibold text-gray-900">{msg.title}</h3>
                                        <span className="text-xs text-gray-500">{formatDate(msg.createdAt)}</span>
                                    </div>
                                    <p className="text-gray-600 text-sm">{msg.content}</p>
                                </div>
                            ))
                        )}
                    </div>
                ) : (
                    <MasonryGrid 
                        userId={userId}
                        folderId={null}
                        viewMode="grid"
                        searchQuery={searchQuery}
                        sourceType={getSourceType()}
                        key={`${activeTab}-${refreshKey}`}
                        onItemCountChange={() => {}}
                    />
                )}
            </div>
        </div>
      </div>

      {showUpload && (
        <UploadModal 
          onClose={() => setShowUpload(false)} 
          folderId={null}
          onUploadSuccess={handleRefresh} 
        />
      )}
    </div>
  )
}
