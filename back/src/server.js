import app from './app.js'
import { env } from './config/env.js'
import { connectDB } from './config/db.js'
import { startAllJobs } from './jobs/index.js'
import { logger } from './utils/logger.js'

const startServer = async () => {
  // DB 연결 확인
  await connectDB()

  const server = app.listen(env.port, () => {
    logger.info(`CLAIQ 백엔드 서버 시작 - PORT: ${env.port}, ENV: ${env.nodeEnv}`)
  })

  // Cron 잡 시작 (개발 환경에서는 선택적)
  if (env.nodeEnv !== 'test') {
    startAllJobs()
  }

  // Graceful shutdown
  const shutdown = (signal) => {
    logger.info(`${signal} 수신, 서버 종료 중...`)
    server.close(() => {
      logger.info('서버 정상 종료')
      process.exit(0)
    })
  }

  process.on('SIGTERM', () => shutdown('SIGTERM'))
  process.on('SIGINT', () => shutdown('SIGINT'))

  process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled Rejection:', reason)
  })
}

startServer().catch((err) => {
  logger.error('서버 시작 실패:', err.message)
  process.exit(1)
})
