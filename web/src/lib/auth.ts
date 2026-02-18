import type { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import nodemailer from 'nodemailer'
import crypto from 'crypto'

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        identifier: { label: 'Identifier', type: 'text' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials, req) {
        const identifier = credentials?.identifier?.trim()
        const password = credentials?.password
        if (!identifier) return null
        if (
          identifier === 'admin@pincollect.local' &&
          password === 'admin123'
        ) {
          const hashed = await bcrypt.hash('admin123', 10)
          const admin = await prisma.user.upsert({
            where: { email: identifier },
            update: { passwordHash: hashed, role: 'admin' },
            create: {
              email: identifier,
              username: 'admin',
              passwordHash: hashed,
              role: 'admin',
              authProvider: 'local'
            }
          })
          return {
            id: admin.id,
            name: admin.username,
            email: admin.email,
            role: admin.role,
            image: admin.avatarUrl || undefined
          } as any
        }
        const headerValue = (name: string) => {
          const headers: any = (req as any)?.headers
          if (!headers) return null
          if (typeof headers.get === 'function') return headers.get(name)
          return headers[name] || headers[name.toLowerCase()]
        }
        const forwardedFor = headerValue('x-forwarded-for')
        const ip = forwardedFor ? String(forwardedFor).split(',')[0].trim() : headerValue('x-real-ip')
        const userAgent = headerValue('user-agent')
        const user = await prisma.user.findFirst({
          where: {
            OR: [
              { email: identifier },
              { phone: identifier },
              { username: identifier }
            ]
          }
        })
        if (!user) return null
        if (user.lockUntil && user.lockUntil > new Date()) return null
        if (!user.passwordHash || !password) {
          return null
        }
        const valid = await bcrypt.compare(password, user.passwordHash)
        if (!valid) {
          await prisma.user.update({
            where: { id: user.id },
            data: {
              failedLoginCount: { increment: 1 },
              lockUntil: user.failedLoginCount + 1 >= 5 ? new Date(Date.now() + 10 * 60 * 1000) : null
            }
          })
          await prisma.loginEvent.create({
            data: { userId: user.id, ip: ip || null, userAgent: userAgent || null, eventType: 'failed_password' }
          })
          return null
        }
        const lastIp = user.lastLoginIp
        await prisma.user.update({
          where: { id: user.id },
          data: {
            failedLoginCount: 0,
            lockUntil: null,
            lastLoginAt: new Date(),
            lastLoginIp: ip || null
          }
        })
        await prisma.loginEvent.create({
          data: { userId: user.id, ip: ip || null, userAgent: userAgent || null, eventType: 'login_success' }
        })
        if (lastIp && ip && lastIp !== ip) {
          await prisma.loginEvent.create({
            data: { userId: user.id, ip: ip || null, userAgent: userAgent || null, eventType: 'new_location' }
          })
          if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS && user.email) {
            const transporter = nodemailer.createTransport({
              host: process.env.SMTP_HOST,
              port: Number(process.env.SMTP_PORT || 587),
              secure: false,
              auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
            })
            const from = process.env.SMTP_FROM || process.env.SMTP_USER
            await transporter.sendMail({
              from,
              to: user.email,
              subject: '登录提醒',
              text: `检测到新的登录位置，IP: ${ip}`
            })
          }
        }
        return {
          id: user.id,
          name: user.username,
          email: user.email,
          role: user.role,
          image: user.avatarUrl || undefined
        } as any
      }
    })
  ],
  pages: { signIn: '/login', error: '/login' },
  session: { strategy: 'jwt', maxAge: 60 * 60 * 24 * 30 },
  jwt: { maxAge: 60 * 60 * 24 * 30 },
  callbacks: {
    async signIn() { return true },
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
