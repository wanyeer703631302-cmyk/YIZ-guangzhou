'use client'

interface User {
  id: string
  name: string
  avatar: string
  count: number
}

interface UserTabsProps {
  users: User[]
  currentUserId: string
  onSelectUser: (id: string) => void
}

export function UserTabs({ users, currentUserId, onSelectUser }: UserTabsProps) {
  return (
    <div className="flex items-center gap-2 py-3 overflow-x-auto scrollbar-hide">
      {users.map((user) => (
        <button
          key={user.id}
          onClick={() => onSelectUser(user.id)}
          className={`flex items-center gap-3 px-4 py-2 rounded-full transition-all whitespace-nowrap ${
            currentUserId === user.id
              ? 'bg-black text-white'
              : 'bg-transparent text-gray-700 hover:bg-gray-100'
          }`}
        >
          <img
            src={user.avatar}
            alt={user.name}
            className={`w-8 h-8 rounded-full object-cover border-2 ${
              currentUserId === user.id ? 'border-white/30' : 'border-transparent'
            }`}
          />
          <div className="flex flex-col items-start">
            <span className="font-medium text-sm">{user.name}</span>
            <span className={`text-xs ${currentUserId === user.id ? 'text-gray-300' : 'text-gray-500'}`}>
              {user.count} 素材
            </span>
          </div>
        </button>
      ))}
    </div>
  )
}
