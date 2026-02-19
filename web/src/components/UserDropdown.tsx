'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { signOut } from 'next-auth/react'
import { User, Lock, LogOut, Camera, X, Upload, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface UserDropdownProps {
  user: {
    name?: string | null
    email?: string | null
    image?: string | null
    id?: string
  }
}

export function UserDropdown({ user }: UserDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [showAvatarModal, setShowAvatarModal] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout>()
  const router = useRouter()

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => setIsOpen(true), 200)
  }

  const handleMouseLeave = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => setIsOpen(false), 300)
  }

  return (
    <div 
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button 
        className="flex items-center gap-2 hover:bg-gray-100 p-1 rounded-full transition-colors"
        onClick={() => {
          if (user.id) {
            router.push(`/user/${user.id}`)
          }
        }}
        onMouseEnter={handleMouseEnter}
      >
        {user.image ? (
          <Image 
            src={user.image} 
            alt={user.name || 'User'} 
            width={32} 
            height={32} 
            className="rounded-full object-cover w-8 h-8" 
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              const fallback = target.parentElement?.querySelector('.avatar-fallback') as HTMLElement;
              if (fallback) fallback.style.display = 'flex';
            }}
          />
        ) : null}
        <div className={`avatar-fallback w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-gray-500 text-sm font-medium ${
          user.image ? 'hidden' : 'flex'
        }`}>
          {(user.name?.[0] || user.email?.[0] || 'U').toUpperCase()}
        </div>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-[180px] bg-white rounded-lg shadow-xl border border-gray-100 py-2 z-50 animate-in fade-in zoom-in-95 duration-200 origin-top-right">
          <div className="px-4 py-2 border-b border-gray-100 mb-2">
            <p className="font-medium text-sm truncate">{user.name}</p>
            <p className="text-xs text-gray-500 truncate">{user.email}</p>
          </div>
          
          <button 
            onClick={() => { setIsOpen(false); setShowAvatarModal(true) }}
            className="w-full px-4 py-2 text-left text-sm hover:bg-[#f5f5f5] flex items-center gap-2"
            role="menuitem"
          >
            <Camera className="w-4 h-4" />
            更换头像
          </button>
          
          <button 
            onClick={() => { setIsOpen(false); setShowPasswordModal(true) }}
            className="w-full px-4 py-2 text-left text-sm hover:bg-[#f5f5f5] flex items-center gap-2"
            role="menuitem"
          >
            <Lock className="w-4 h-4" />
            修改密码
          </button>
          
          <div className="border-t border-gray-100 my-1" />
          
          <button 
            onClick={() => signOut({ callbackUrl: '/' })}
            className="w-full px-4 py-2 text-left text-sm hover:bg-[#f5f5f5] flex items-center gap-2 text-red-600"
            role="menuitem"
          >
            <LogOut className="w-4 h-4" />
            退出登录
          </button>
        </div>
      )}

      {showAvatarModal && <AvatarModal onClose={() => setShowAvatarModal(false)} />}
      {showPasswordModal && <PasswordModal onClose={() => setShowPasswordModal(false)} />}
    </div>
  )
}

function AvatarModal({ onClose }: { onClose: () => void }) {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0]
    if (selected) {
      if (selected.size > 2 * 1024 * 1024) {
        setError('图片大小不能超过 2MB')
        return
      }
      setFile(selected)
      const reader = new FileReader()
      reader.onloadend = () => setPreview(reader.result as string)
      reader.readAsDataURL(selected)
      setError('')
    }
  }

  const handleUpload = async () => {
    if (!preview) return
    setUploading(true)
    try {
      const res = await fetch('/api/user/avatar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: preview }),
      })
      const data = await res.json()
      if (data.success) {
        window.location.reload() // Reload to reflect changes
      } else {
        setError(data.message)
      }
    } catch (e) {
      setError('上传失败')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-md p-6 relative">
        <button onClick={onClose} className="absolute right-4 top-4 p-2 hover:bg-gray-100 rounded-full">
          <X className="w-5 h-5 text-gray-500" />
        </button>
        <h3 className="text-xl font-bold mb-6">更换头像</h3>
        
        <div className="flex flex-col items-center gap-6">
          <div className="relative w-32 h-32 rounded-full overflow-hidden bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center group">
            {preview ? (
              <Image src={preview} alt="Preview" fill className="object-cover" />
            ) : (
              <Upload className="w-8 h-8 text-gray-400" />
            )}
            <input 
              type="file" 
              accept="image/png, image/jpeg" 
              className="absolute inset-0 opacity-0 cursor-pointer"
              onChange={handleFileChange}
            />
          </div>
          
          <div className="text-center">
            <p className="text-sm text-gray-500">点击上传图片</p>
            <p className="text-xs text-gray-400 mt-1">支持 JPG/PNG，小于 2MB</p>
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <div className="flex gap-3 w-full mt-2">
            <button 
              onClick={onClose}
              className="flex-1 py-2.5 bg-gray-100 rounded-full font-medium hover:bg-gray-200 transition-colors"
            >
              取消
            </button>
            <button 
              onClick={handleUpload}
              disabled={!file || uploading}
              className="flex-1 py-2.5 bg-black text-white rounded-full font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : '确认更换'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function PasswordModal({ onClose }: { onClose: () => void }) {
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    if (newPassword !== confirmPassword) {
      setError('两次输入的密码不一致')
      return
    }
    if (newPassword.length < 8) {
      setError('密码长度需至少 8 位')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/user/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oldPassword, newPassword }),
      })
      const data = await res.json()
      if (data.success) {
        onClose()
        // Maybe toast success?
      } else {
        setError(data.message)
      }
    } catch (e) {
      setError('修改失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-md p-6 relative">
        <button onClick={onClose} className="absolute right-4 top-4 p-2 hover:bg-gray-100 rounded-full">
          <X className="w-5 h-5 text-gray-500" />
        </button>
        <h3 className="text-xl font-bold mb-6">修改密码</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">旧密码</label>
            <input 
              type="password"
              value={oldPassword}
              onChange={e => setOldPassword(e.target.value)}
              className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/5"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">新密码</label>
            <input 
              type="password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/5"
              placeholder="8位以上，含大小写及数字"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">确认新密码</label>
            <input 
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/5"
            />
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <div className="flex gap-3 mt-4">
            <button 
              onClick={onClose}
              className="flex-1 py-2.5 bg-gray-100 rounded-full font-medium hover:bg-gray-200 transition-colors"
            >
              取消
            </button>
            <button 
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 py-2.5 bg-black text-white rounded-full font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : '确认修改'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
