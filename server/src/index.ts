import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import multer from 'multer'
import { v2 as cloudinary } from 'cloudinary'

dotenv.config()

// 配置 Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
})

const app = express()
const PORT = process.env.PORT || 3001

// 中间件
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}))
app.use(express.json())

// 使用内存存储
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req: any, file: any, cb: any) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true)
    } else {
      cb(new Error('只支持图片文件'))
    }
  }
})

// 模拟数据库
const assets: any[] = []

// 健康检查
app.get('/health', (req: any, res: any) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// API 根
app.get('/api', (req: any, res: any) => {
  res.json({ message: 'PinCollect API v1.0 with Cloudinary' })
})

// 文件上传接口
app.post('/api/upload', upload.single('file'), async (req: any, res: any) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '没有上传文件' })
    }

    // 上传到 Cloudinary
    const b64 = Buffer.from(req.file.buffer).toString('base64')
    const dataURI = "data:" + req.file.mimetype + ";base64," + b64
    
    const result = await cloudinary.uploader.upload(dataURI, {
      folder: 'pincollect',
      resource_type: 'auto'
    })

    const { folderId, tags, title } = req.body
    
    const asset = {
      id: Date.now().toString(),
      title: title || req.file.originalname,
      filename: req.file.filename,
      originalName: req.file.originalname,
      url: result.secure_url,
      thumbnailUrl: result.secure_url.replace('/upload/', '/upload/w_400,h_400,c_fit/'),
      size: req.file.size,
      mimetype: req.file.mimetype,
      folderId: folderId || null,
      tags: tags ? tags.split(',').map((t: string) => t.trim()) : [],
      cloudinaryId: result.public_id,
      createdAt: new Date().toISOString()
    }
    
    assets.push(asset)
    
    res.json({ 
      success: true, 
      message: '上传成功',
      data: asset 
    })
  } catch (error: any) {
    console.error('上传错误:', error)
    res.status(500).json({ 
      error: '上传失败',
      message: error.message 
    })
  }
})

// 获取素材列表
app.get('/api/assets', (req: any, res: any) => {
  const { folderId, page = 1, limit = 20 } = req.query
  
  let result = [...assets]
  
  if (folderId) {
    result = result.filter((a: any) => a.folderId === folderId)
  }
  
  const start = (Number(page) - 1) * Number(limit)
  const end = start + Number(limit)
  const paginated = result.slice(start, end)
  
  res.json({
    success: true,
    data: {
      items: paginated,
      total: result.length,
      page: Number(page),
      limit: Number(limit)
    }
  })
})

// 删除素材
app.delete('/api/assets/:id', async (req: any, res: any) => {
  const index = assets.findIndex((a: any) => a.id === req.params.id)
  if (index === -1) {
    return res.status(404).json({ error: '素材不存在' })
  }
  
  const asset = assets[index]
  
  // 从 Cloudinary 删除
  if (asset.cloudinaryId) {
    try {
      await cloudinary.uploader.destroy(asset.cloudinaryId)
    } catch (e) {
      console.error('删除 Cloudinary 文件失败:', e)
    }
  }
  
  assets.splice(index, 1)
  res.json({ success: true, message: '删除成功' })
})

// 错误处理
app.use((err: any, req: any, res: any, next: any) => {
  console.error('服务器错误:', err)
  res.status(500).json({ 
    error: '服务器错误',
    message: err.message || 'Something went wrong!'
  })
})

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`)
  console.log(`☁️  Cloudinary: ${process.env.CLOUDINARY_CLOUD_NAME || '未配置'}`)
})
