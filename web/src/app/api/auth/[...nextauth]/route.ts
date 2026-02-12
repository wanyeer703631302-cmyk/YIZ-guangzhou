import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        // 简单验证
        if (credentials?.email === 'admin@pincollect.local' && credentials?.password === 'admin123') {
          return {
            id: '1',
            name: '管理员',
            email: 'admin@pincollect.local',
            image: 'https://i.pravatar.cc/150?u=admin'
          }
        }
        return null
      }
    })
  ],
  pages: {
    signIn: '/login',
    error: '/login', // 错误时跳转到登录页
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30天
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id
      }
      return session
    },
    async redirect({ url, baseUrl }) {
      // 确保重定向到正确的域名
      if (url.startsWith('/')) return `${baseUrl}${url}`
      else if (new URL(url).origin === baseUrl) return url
      return baseUrl
    }
  },
  // 信任主机（解决某些部署问题）
  trustHost: true,
})

export { handler as GET, handler as POST }
