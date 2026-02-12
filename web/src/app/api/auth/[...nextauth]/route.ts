// @ts-nocheck
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
        if (credentials?.email === 'admin@pincollect.local' && credentials?.password === 'admin123') {
          return {
            id: '1',
            name: '管理员',
            email: 'admin@pincollect.local',
            role: 'admin',
            image: 'https://i.pravatar.cc/150?u=admin'
          }
        }
        return null
      }
    })
  ],
  pages: { signIn: '/login', error: '/login' },
  session: { strategy: 'jwt' },
  callbacks: {
    async jwt({ token, user }: any) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }: any) {
      if (session?.user) {
        // 使用非常保险的写法
        const userWithData = session.user as any;
        const tokenWithData = token as any;
        userWithData.id = tokenWithData.id || tokenWithData.sub;
        userWithData.role = tokenWithData.role || 'user';
      }
      return session;
    }
  }
})

export { handler as GET, handler as POST }
