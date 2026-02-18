'use client'

import { signIn } from 'next-auth/react'
import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || '/'
  
  const [mode, setMode] = useState<'password' | 'code'>('password')
  const [identifier, setIdentifier] = useState('admin@pincollect.local')
  const [password, setPassword] = useState('admin123')
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)

  useEffect(() => {
    const errorParam = searchParams.get('error')
    if (errorParam) {
      const errorMessages: Record<string, string> = {
        'CredentialsSignin': '登录失败',
        'SessionRequired': '请先登录',
        'Default': '登录失败，请重试'
      }
      setError(errorMessages[errorParam] || errorMessages['Default'])
    }
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const result = await signIn('credentials', {
        identifier,
        password: mode === 'password' ? password : undefined,
        code: mode === 'code' ? code : undefined,
        mode,
        redirect: false,
        callbackUrl
      })
      if (result?.error) {
        setError('登录失败，请检查输入')
        setLoading(false)
      } else if (result?.ok) {
        router.push(callbackUrl)
        router.refresh()
      }
    } catch (err) {
      setError('系统错误，请重试')
      setLoading(false)
    }
  }

  const sendCode = async () => {
    if (!identifier.trim()) return
    setSending(true)
    setError('')
    try {
      const res = await fetch('/api/auth/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, purpose: 'login' })
      })
      const result = await res.json()
      if (!result.success) throw new Error(result.message)
    } catch (e: any) {
      setError(e.message || '发送验证码失败')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
            </svg>
          </div>
          <h1 className="text-2xl font-bold">PinCollect</h1>
          <p className="text-gray-500 mt-2">企业素材管理系统</p>
        </div>

        <div className="flex gap-2 mb-4">
          <button
            className={`px-3 py-1.5 rounded-full text-sm ${mode === 'password' ? 'bg-black text-white' : 'bg-gray-100 text-gray-600'}`}
            onClick={() => setMode('password')}
          >
            密码登录
          </button>
          <button
            className={`px-3 py-1.5 rounded-full text-sm ${mode === 'code' ? 'bg-black text-white' : 'bg-gray-100 text-gray-600'}`}
            onClick={() => setMode('code')}
          >
            验证码登录
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">邮箱/用户名</label>
            <input
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
              required
            />
          </div>

          {mode === 'password' ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">密码</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                required
              />
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">验证码</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                  required
                />
                <button
                  type="button"
                  onClick={sendCode}
                  disabled={sending}
                  className="px-3 py-2 bg-gray-900 text-white rounded-lg text-sm disabled:opacity-50"
                >
                  {sending ? '发送中...' : '发送验证码'}
                </button>
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-50"
          >
            {loading ? '登录中...' : '登录'}
          </button>
        </form>

        <div className="mt-4">
          <button
            type="button"
            onClick={() => signIn('google', { callbackUrl })}
            className="w-full bg-white border border-gray-300 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors"
          >
            使用 Google 登录
          </button>
        </div>

        <div className="mt-6 text-center text-sm text-gray-500">
          <p>默认账号: admin@pincollect.local</p>
          <p>默认密码: admin123</p>
        </div>
      </div>
    </div>
  )
}
