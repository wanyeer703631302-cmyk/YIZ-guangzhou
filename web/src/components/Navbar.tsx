'use client'

import { useState } from 'react'
import { Search, Plus, LogOut, X } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { signOut } from 'next-auth/react'
import { UserDropdown } from './UserDropdown'

interface NavbarProps {
  user: {
    name?: string | null
    email?: string | null
    image?: string | null
    id?: string
    role?: string
  }
  searchQuery?: string
  onSearchChange?: (query: string) => void
  onUploadClick?: () => void
}

export function Navbar({ user, searchQuery = '', onSearchChange, onUploadClick }: NavbarProps) {
  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-[1920px] mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
              </svg>
            </div>
            <span className="text-xl font-bold">PinCollect</span>
          </Link>

          {/* Search */}
          {onSearchChange && (
            <div className="flex-1 max-w-2xl mx-8 hidden md:block">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  placeholder="搜索素材、标签、文件夹..."
                  className="w-full pl-10 pr-10 py-2 bg-gray-100 border-none rounded-full focus:outline-none focus:ring-2 focus:ring-gray-200 transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => onSearchChange('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-200 rounded-full"
                  >
                    <X className="w-4 h-4 text-gray-400" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3">
            {onUploadClick && (
              <button
                onClick={onUploadClick}
                className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-full font-medium hover:bg-gray-800 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">上传</span>
              </button>
            )}

            <div className="pl-3 border-l border-gray-200 ml-3">
              <UserDropdown user={user} />
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
