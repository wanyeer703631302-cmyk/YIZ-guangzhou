import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'

// 确保环境变量存在
if (!process.env.NEXTAUTH_SECRET) {
  throw new Error('Please provide process.env.NEXTAUTH_SECRET')
}

if (!process.env.NEXTAUTH_URL) {
  throw new Error('Please provide process.env.NEXTAUTH_URL')
}

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: '邮箱', type: 'email' },
        password: { label: '密码', type: 'password' }
      },
      async authorize(credentials) {
        try {
          // 调用后端 API 验证（先使用本地验证，后续替换为 API 调用）
          if (credentials?.email === 'admin@pincollect.local' && credentials?.password === 'admin123') {
            return {
              id: '1',
              name: '管理员',
              email: 'admin@pincollect.local',
              image: 'https://i.pravatar.cc/150?u=admin',
              role: 'admin'
            }
          }
          
          // TODO: 后续替换为真实 API 调用
          // const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`, {
          //   method: 'POST',
          //   body: JSON.stringify(credentials),
          //   headers: { 'Content-Type': 'application/json' }
          // })
          // const user = await res.json()
          // if (res.ok && user) return user
          
          return null
        } catch (error) {
          console.error('Auth error:', error)
          return null
        }
      }
    })
  ],
  pages: {
    signIn: '/login',
    error: '/login', // 错误时重定向到登录页
    signOut: '/login'
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30天
    updateAge: 24 * 60 * 60, // 24小时更新一次
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60,
  },
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id
        token.role = (user as any).role
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id
        (session.user as any).role = token.role
      }
      return session
    },
    async redirect({ url, baseUrl }) {
      // 允许相对路径
      if (url.startsWith('/')) return `${baseUrl}${url}`
      // 允许同一域名
      if (new URL(url).origin === baseUrl) return url
      // 默认返回首页
      return baseUrl
    }
  },
  // 调试模式（生产环境设为 false）
  debug: process.env.NODE_ENV === 'development',
})

export { handler as GET, handler as POST }
