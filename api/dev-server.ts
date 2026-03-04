import 'dotenv/config'
import cors from 'cors'
import express from 'express'
import type { VercelRequest, VercelResponse } from '@vercel/node'
import healthFastHandler from './health-fast'
import loginHandler from './auth/login'
import sessionHandler from './auth/session'
import assetsHandler from './assets'
import uploadHandler from './upload'
import interactionsHandler from './user/interactions'

type ApiHandler = (req: VercelRequest, res: VercelResponse) => Promise<void> | void

const app = express()
const port = Number(process.env.PORT || 3000)

app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

const route = (path: string, handler: ApiHandler) => {
  app.all(path, async (req, res) => {
    try {
      await handler(req as unknown as VercelRequest, res as unknown as VercelResponse)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Internal server error'
      res.status(500).json({ success: false, error: message })
    }
  })
}

route('/api/health', healthFastHandler)
route('/api/auth/login', loginHandler)
route('/api/auth/session', sessionHandler)
route('/api/assets', assetsHandler)
route('/api/upload', uploadHandler)
route('/api/user/interactions', interactionsHandler)

app.listen(port, () => {
  console.log(`API server running: http://localhost:${port}`)
  console.log(`Health check: http://localhost:${port}/api/health`)
})
