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
  destination: (req, file, cb) => {
    cb(null, uploadsDir)
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    const ext = path.extname(file.originalname)
    cb(null, uniqueSuffix + ext)
  }
})

const upload = multer({ 
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('只支持 JPG, PNG, GIF, WebP 图片格式'))
    }
  }
})

// 内存存储（用于 Railway 等无文件系统环境）
const memoryStorage = multer.memoryStorage()
const uploadMemory = multer({
  storage: memoryStorage,
  limits: { fileSize: 20 * 1024 * 1024 }
})

// 模拟数据库（实际项目应该使用 PostgreSQL）
const assets: any[] = []

// 健康检查
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development'
  })
})

// API 根
app.get('/api', (req, res) => {
  res.json({ 
    message: 'PinCollect API v1.0',
    endpoints: [
      'POST /api/upload - 上传文件',
      'GET /api/assets - 获取素材列表',
      'GET /api/assets/:id - 获取单个素材'
    ]
  })
})

// 文件上传接口
app.post('/api/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '没有上传文件' })
    }

    const { folderId, tags, title } = req.body
    
    // 构建文件 URL
    const protocol = req.headers['x-forwarded-proto'] || req.protocol
    const host = req.headers['x-forwarded-host'] || req.get('host')
    const fileUrl = `${protocol}://${host}/uploads/${req.file.filename}`
    
    // 保存素材信息
    const asset = {
      id: Date.now().toString(),
      title: title || req.file.originalname,
      filename: req.file.filename,
      originalName: req.file.originalname,
      url: fileUrl,
      thumbnailUrl: fileUrl, // 实际应该生成缩略图
      size: req.file.size,
      mimetype: req.file.mimetype,
      folderId: folderId || null,
      tags: tags ? tags.split(',').map((t: string) => t.trim()) : [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    assets.push(asset)
    
    console.log('文件上传成功:', asset.filename)
    
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
app.get('/api/assets', (req, res) => {
  const { folderId, userId, page = 1, limit = 20 } = req.query
  
  let result = [...assets]
  
  // 按文件夹筛选
  if (folderId) {
    result = result.filter(a => a.folderId === folderId)
  }
  
  // 分页
  const start = (Number(page) - 1) * Number(limit)
  const end = start + Number(limit)
  const paginated = result.slice(start, end)
  
  res.json({
    success: true,
    data: {
      items: paginated,
      total: result.length,
      page: Number(page),
      limit: Number(limit),
      hasMore: end < result.length
    }
  })
})

// 获取单个素材
app.get('/api/assets/:id', (req, res) => {
  const asset = assets.find(a => a.id === req.params.id)
  if (!asset) {
    return res.status(404).json({ error: '素材不存在' })
  }
  res.json({ success: true, data: asset })
})

// 删除素材
app.delete('/api/assets/:id', (req, res) => {
  const index = assets.findIndex(a => a.id === req.params.id)
  if (index === -1) {
    return res.status(404).json({ error: '素材不存在' })
  }
  
  // 删除文件
  const asset = assets[index]
  const filePath = path.join(uploadsDir, asset.filename)
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath)
  }
  
  assets.splice(index, 1)
  res.json({ success: true, message: '删除成功' })
})

// 静态文件服务（上传的图片）
app.use('/uploads', express.static(uploadsDir))

// 错误处理
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('服务器错误:', err.stack)
  res.status(500).json({ 
    error: '服务器错误',
    message: err.message || 'Something went wrong!'
  })
})

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`)
  console.log(`📁 Upload directory: ${uploadsDir}`)
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`)
})
