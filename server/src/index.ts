import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import multer from 'multer'
import path from 'path'
import fs from 'fs'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

// 中间件
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}))
app.use(express.json())

// 创建上传目录
const uploadsDir = path.join(__dirname, '..', 'uploads')
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true })
}

// 配置文件上传
const storage = multer.diskStorage({
  destination: (req: any, file: any, cb: any) => {
    cb(null, uploadsDir)
  },
  filename: (req: any, file: any, cb: any) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    const ext = path.extname(file.originalname)
    cb(null, uniqueSuffix + ext)
  }
})

const upload = multer({ 
  storage,
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (req: any, file: any, cb: any) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('只支持 JPG, PNG, GIF, WebP 图片格式'))
    }
  }
})

// 模拟数据库
const assets: any[] = []

// 健康检查
app.get('/health', (req: any, res: any) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString()
  })
})

// API 根
app.get('/api', (req: any, res: any) => {
  res.json({ 
    message: 'PinCollect API v1.0',
    endpoints: [
      'POST /api/upload - 上传文件',
      'GET /api/assets - 获取素材列表'
    ]
  })
})

// 文件上传接口
app.post('/api/upload', upload.single('file'), (req: any, res: any) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '没有上传文件' })
    }

    const { folderId, tags, title } = req.body
    
    const protocol = req.headers['x-forwarded-proto'] || req.protocol
    const host = req.headers['x-forwarded-host'] || req.get('host')
    const fileUrl = `${protocol}://${host}/uploads/${req.file.filename}`
    
    const asset = {
      id: Date.now().toString(),
      title: title || req.file.originalname,
      filename: req.file.filename,
      originalName: req.file.originalname,
      url: fileUrl,
      thumbnailUrl: fileUrl,
      size: req.file.size,
      mimetype: req.file.mimetype,
      folderId: folderId || null,
      tags: tags ? tags.split(',').map((t: string) => t.trim()) : [],
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

// 静态文件服务
app.use('/uploads', express.static(uploadsDir))

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
})
