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
          {user.avatar ? (
            <img
              src={user.avatar}
              alt={user.name}
              className={`w-8 h-8 rounded-full object-cover border-2 ${
                currentUserId === user.id ? 'border-white/30' : 'border-transparent'
              }`}
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                target.nextElementSibling?.classList.remove('hidden');
              }}
            />
          ) : null}
          <div className={`w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 text-sm font-medium border-2 ${
            currentUserId === user.id ? 'border-white/30' : 'border-transparent'
          } ${user.avatar ? 'hidden' : ''}`}>
            {user.name.charAt(0).toUpperCase()}
          </div>
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
