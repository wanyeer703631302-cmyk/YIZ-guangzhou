import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import nodemailer from 'nodemailer'
import crypto from 'crypto'
export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const identifier = String(body?.identifier || '').trim()
    const purpose = String(body?.purpose || '').trim()
    const channel = String(body?.channel || '').trim()
    if (!identifier || !purpose) {
      return NextResponse.json({ success: false, message: '缺少参数' }, { status: 400 })
    }
    const isEmail = identifier.includes('@')
    const sendChannel = channel || (isEmail ? 'email' : 'sms')
    const code = Math.floor(100000 + Math.random() * 900000).toString()
    const codeHash = crypto.createHash('sha256').update(code).digest('hex')
    await prisma.verificationCode.create({
      data: {
        identifier,
        purpose,
        codeHash,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000)
      }
    })
    if (sendChannel === 'email') {
      if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
        return NextResponse.json({ success: false, message: '邮件服务未配置' }, { status: 500 })
      }
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 587),
        secure: false,
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
      })
      const from = process.env.SMTP_FROM || process.env.SMTP_USER
      await transporter.sendMail({
        from,
        to: identifier,
        subject: '验证码',
        text: `验证码：${code}，10分钟内有效`
      })
    } else {
      if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_FROM) {
        return NextResponse.json({ success: false, message: '短信服务未配置' }, { status: 500 })
      }
      const url = `https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Messages.json`
      const params = new URLSearchParams({
        To: identifier,
        From: process.env.TWILIO_FROM,
        Body: `验证码：${code}，10分钟内有效`
      })
      const auth = Buffer.from(`${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`).toString('base64')
      const res = await fetch(url, {
        method: 'POST',
        headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString()
      })
      if (!res.ok) {
        return NextResponse.json({ success: false, message: '短信发送失败' }, { status: 500 })
      }
    }
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message || '发送失败' }, { status: 500 })
  }
}
