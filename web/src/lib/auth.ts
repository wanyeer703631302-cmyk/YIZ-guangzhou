import type { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import CredentialsProvider from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import { prisma } from '@/lib/prisma'

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || ''
    }),
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
          const email = credentials?.email
          const password = credentials?.password
          if (email === 'admin@pincollect.local' && password === 'admin123') {
            const user = await prisma.user.upsert({
              where: { email },
              update: { role: 'admin' },
              create: {
                email,
                username: '管理员',
                role: 'admin',
                avatarUrl: 'https://i.pravatar.cc/150?u=admin'
              }
            })
            return {
              id: user.id,
              name: user.username,
              email: user.email,
              role: user.role,
              image: user.avatarUrl || undefined
            } as any
          }
          return null
      }
    })
  ],
  pages: { signIn: '/login', error: '/login' },
  session: { strategy: 'jwt' },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        // @ts-ignore
        token.id = (user as any).id || (token as any).sub
        // @ts-ignore
        token.role = (user as any).role || 'user'
      }
      return token
    },
    async session({ session, token }) {
      if (session?.user) {
        // @ts-ignore
        (session.user as any).id = (token as any).id || (token as any).sub
        // @ts-ignore
        ;(session.user as any).role = (token as any).role || 'user'
      }
      return session
    }
  },
  secret: process.env.NEXTAUTH_SECRET
}
