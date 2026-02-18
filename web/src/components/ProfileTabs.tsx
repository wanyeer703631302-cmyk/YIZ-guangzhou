'use client'

import { MessageSquare, Star, Image as ImageIcon, Heart } from 'lucide-react'

interface ProfileTabsProps {
  activeTab: string
  onTabChange: (tab: string) => void
  isOwner: boolean
  messageCount?: number
}

export function ProfileTabs({ activeTab, onTabChange, isOwner, messageCount = 0 }: ProfileTabsProps) {
  const tabs = [
    { id: 'uploads', label: isOwner ? '我的上传' : 'Ta的上传', icon: ImageIcon },
    ...(isOwner ? [
      { id: 'favorites', label: '我的收藏', icon: Star },
      { id: 'likes', label: '我的点赞', icon: Heart },
      { id: 'messages', label: '我的消息', icon: MessageSquare, badge: messageCount }
    ] : [])
  ]

  return (
    <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-full mb-6 w-fit">
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
            activeTab === tab.id
              ? 'bg-white text-black shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <tab.icon className="w-4 h-4" />
          {tab.label}
          {tab.badge !== undefined && tab.badge > 0 && (
            <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full min-w-[1.2em] text-center">
              {tab.badge > 99 ? '99+' : tab.badge}
            </span>
          )}
        </button>
      ))}
    </div>
  )
}
