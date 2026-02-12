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
        // 模拟登录逻辑
        if (credentials?.email === 'admin@pincollect.local' && credentials?.password === 'admin123') {
          return {
            id: '1',
            name: '管理员',
            email: 'admin@pincollect.local',
            role: 'admin', // 添加角色信息
            image: 'https://i.pravatar.cc/150?u=admin'
          }
        }
        return null
      }
    })
  ],
  pages: {
    signIn: '/login',
    error: '/login'
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60
  },
  callbacks: {
    // 1. 将信息存入 JWT token
    async jwt({ token, user }: any) {
      if (user) {
        token.id = user.id
        token.role = user.role
      }
      return token
    },
    // 2. 将 JWT token 中的信息传递给 Session，供前端调用
    async session({ session, token }: any) {
      if (session.user) {
        session.user.id = token.id
        session.user.role = token.role
      }
      return session
    }
  }
})

export { handler as GET, handler as POST }
