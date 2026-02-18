'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function UserRootPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      // @ts-ignore - session.user.id is added in auth.ts
      const userId = session.user.id || session.user.name
      if (userId) {
        router.replace(`/user/${userId}`)
      } else {
        router.replace('/')
      }
    } else if (status === 'unauthenticated') {
      router.replace('/login')
    }
  }, [status, session, router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-gray-200 border-t-black rounded-full animate-spin" />
    </div>
  )
}
