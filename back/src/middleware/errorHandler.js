import { logger } from '../utils/logger.js'
import { env } from '../config/env.js'

export const errorHandler = (err, req, res, next) => {
  const status = err.status || 500
  const message = err.message || '서버 내부 오류가 발생했습니다'

  if (status >= 500) {
    logger.error(`[${req.method}] ${req.path} - ${status}: ${message}`)
    if (env.nodeEnv !== 'production') {
      logger.error(err.stack)
    }
  }

  res.status(status).json({ success: false, message })
}
