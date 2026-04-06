import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import cookieParser from 'cookie-parser'
import { env } from './config/env.js'
import { defaultLimiter } from './middleware/rateLimiter.js'
import { errorHandler } from './middleware/errorHandler.js'
import apiRoutes from './routes/index.js'

const app = express()

// 보안 헤더
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}))

// CORS
const allowedOrigins = env.corsOrigin.split(',').map((o) => o.trim())
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true)
    } else {
      callback(new Error('CORS 정책에 의해 차단된 요청입니다'))
    }
  },
  credentials: true,
}))

// Rate limiting
app.use(defaultLimiter)

// Body 파싱
app.use(express.json({ limit: '100kb' }))
app.use(express.urlencoded({ extended: true, limit: '100kb' }))
app.use(cookieParser())

// 로깅
if (env.nodeEnv !== 'test') {
  app.use(morgan('dev'))
}

app.disable('x-powered-by')

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'CLAIQ API 정상 작동 중', version: '1.0.0', timestamp: new Date().toISOString() })
})

// API 라우터
app.use('/api', apiRoutes)

// 전역 에러 핸들러
app.use(errorHandler)

export default app
