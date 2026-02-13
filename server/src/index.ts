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

// 支持多个前端域名（包括 Vercel 预览域名）
const allowedOrigins = [
  // 生产环境域名
  'https://yiz-guangzhou-web.vercel.app',
  // 本地开发
  'http://localhost:3000',
  'http://localhost:5173',
  // 正则：匹配所有 vercel.app 子域名（预览部署）
  /^https:\/\/[a-z0-9-]+\.vercel\.app$/,
  // 正则：匹配所有 railway.app 子域名（如果有）
  /^https:\/\/[a-z0-9-]+\.up\.railway\.app$/
]

app.use(cors({
  origin: function (origin, callback) {
    // 允许没有 origin 的请求（如 Postman、服务器间请求）
    if (!origin) return callback(null, true)
    
    // 检查是否匹配允许的域名
    const isAllowed = allowedOrigins.some(allowed => {
      if (typeof allowed === 'string') {
        return allowed === origin
      }
      // 正则匹配
      return allowed.test(origin)
    })
    
    if (isAllowed) {
      callback(null, true)
    } else {
      console.log(`CORS blocked: ${origin}`)
      callback(new Error(`CORS policy: ${origin} not allowed`))
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))

app.use(express.json())

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }
})

const assets: any[] = []

app.get('/health', (req: any, res: any) => {
  res.json({
    status: 'ok',
    cloudinary: process.env.CLOUDINARY_CLOUD_NAME ? 'configured' : 'not configured'
  })
})

app.get('/api', (req: any, res: any) => {
  res.json({ message: 'PinCollect API with Cloudinary' })
})

app.post('/api/upload', upload.single('file'), async (req: any, res: any) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' })
    }

    // 上传 to Cloudinary
    const b64 = Buffer.from(req.file.buffer).toString('base64')
    const dataURI = "data:" + req.file.mimetype + ";base64," + b64

    const result = await cloudinary.uploader.upload(dataURI, {
      folder: 'pincollect',
      resource_type: 'auto'
    })

    const asset = {
      id: Date.now().toString(),
      title: req.body.title || req.file.originalname,
      url: result.secure_url,
      thumbnailUrl: result.secure_url.replace('/upload/', '/upload/w_400,c_fit/'),
      size: req.file.size,
      folderId: req.body.folderId || null,
      tags: req.body.tags ? req.body.tags.split(',').map((t: string) => t.trim()) : [],
      createdAt: new Date().toISOString()
    }

    assets.push(asset)

    res.json({ success: true, data: asset })
  } catch (error: any) {
    console.error('Upload error:', error)
    res.status(500).json({ error: error.message })
  }
})

app.get('/api/assets', (req: any, res: any) => {
  const { folderId } = req.query
  let result = [...assets]
  if (folderId) {
    result = result.filter((a: any) => a.folderId === folderId)
  }
  res.json({ success: true, data: { items: result, total: result.length }})
})

app.listen(PORT, () => {
  console.log(`Server on port ${PORT}`)
  console.log('CORS allowed origins:', allowedOrigins.map(o => typeof o === 'string' ? o : o.toString()))
})
