 'use client'

 import { useEffect, useState } from 'react'
 import { useParams } from 'next/navigation'
 import Image from 'next/image'

 interface ProfileData {
   user: { id: string; username: string; avatarUrl: string | null; bio: string | null }
   stats: { assets: number; likes: number; favorites: number }
   tags: { id: string; name: string }[]
 }

 interface AssetItem {
   id: string
   storageUrl: string
   thumbnailUrl: string | null
   title: string | null
 }

 export default function UserProfilePage() {
   const params = useParams()
   const slug = String(params?.slug || '')
   const [profile, setProfile] = useState<ProfileData | null>(null)
   const [assets, setAssets] = useState<AssetItem[]>([])
   const [activeTag, setActiveTag] = useState<string>('全部内容')
   const [loading, setLoading] = useState(true)
   const [error, setError] = useState<string | null>(null)

   useEffect(() => {
     const fetchProfile = async () => {
       try {
         setLoading(true)
         const res = await fetch(`/api/users/${slug}`)
         const result = await res.json()
         if (!result.success) throw new Error(result.message)
         setProfile(result.data)
         setActiveTag('全部内容')
         setError(null)
       } catch (e: any) {
         setError(e.message || '获取用户失败')
       } finally {
         setLoading(false)
       }
     }
     if (slug) fetchProfile()
   }, [slug])

   useEffect(() => {
     const fetchAssets = async () => {
       if (!profile?.user?.id) return
       try {
         const params = new URLSearchParams({
           userId: profile.user.id,
           page: '1',
           limit: '40'
         })
         if (activeTag !== '全部内容') params.append('tag', activeTag)
         const res = await fetch(`/api/assets?${params}`)
         const result = await res.json()
         if (!result.success) throw new Error(result.message)
         setAssets(result.data.items)
       } catch (e) {}
     }
     fetchAssets()
   }, [profile?.user?.id, activeTag])

   if (loading) return <div className="p-6 text-gray-600">加载中...</div>
   if (error) return <div className="p-6 text-red-600">{error}</div>
   if (!profile) return <div className="p-6 text-gray-600">用户不存在</div>

   return (
     <div className="max-w-6xl mx-auto p-6 space-y-6">
       <div className="flex items-center gap-4">
         {profile.user.avatarUrl ? (
           <Image src={profile.user.avatarUrl} alt={profile.user.username} width={72} height={72} className="rounded-full" />
         ) : (
           <div className="w-18 h-18 rounded-full bg-gray-200" />
         )}
         <div>
           <div className="text-2xl font-bold">{profile.user.username}</div>
           {profile.user.bio && <div className="text-sm text-gray-500 mt-1">{profile.user.bio}</div>}
           <div className="flex gap-6 text-sm text-gray-600 mt-2">
             <span>发布 {profile.stats.assets}</span>
             <span>获赞 {profile.stats.likes}</span>
             <span>被收藏 {profile.stats.favorites}</span>
           </div>
         </div>
       </div>

       <div className="flex flex-wrap gap-2">
         {['全部内容', ...profile.tags.map(t => t.name)].map((tag) => (
           <button
             key={tag}
             onClick={() => setActiveTag(tag)}
             className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
               activeTag === tag ? 'bg-black text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
             }`}
           >
             {tag}
           </button>
         ))}
       </div>

       {assets.length === 0 ? (
         <div className="text-gray-500">暂无内容</div>
       ) : (
         <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
           {assets.map((asset) => (
             <div key={asset.id} className="rounded-xl overflow-hidden bg-gray-100">
               <Image
                 src={asset.thumbnailUrl || asset.storageUrl}
                 alt={asset.title || ''}
                 width={400}
                 height={300}
                 className="w-full h-auto object-cover"
               />
             </div>
           ))}
         </div>
       )}
     </div>
   )
 }
