import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { dbOp } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { v2 as cloudinary } from 'cloudinary'

export const runtime = 'nodejs'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    const userId = session?.user?.id as string
    if (!userId) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

    const { image } = await request.json()
    if (!image) return NextResponse.json({ message: 'No image provided' }, { status: 400 })

    const result = await cloudinary.uploader.upload(image, {
      folder: 'covers',
      // Cover image doesn't need strict cropping, maybe just limit width
      transformation: [{ width: 1920, crop: 'limit' }]
    })

    await dbOp(async () => {
      return prisma.user.update({
        where: { id: userId },
        data: { coverUrl: result.secure_url }
      })
    })

    return NextResponse.json({ success: true, url: result.secure_url })
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 })
  }
}
