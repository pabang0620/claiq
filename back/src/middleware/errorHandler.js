import multer from 'multer'
import { logger } from '../utils/logger.js'
import { env } from '../config/env.js'

const MULTER_ERROR_MESSAGES = {
  LIMIT_FILE_SIZE: '파일 크기가 허용 한도를 초과합니다',
  LIMIT_FILE_COUNT: '파일 개수가 허용 한도를 초과합니다',
  LIMIT_UNEXPECTED_FILE: '허용되지 않는 파일 필드입니다',
}

export const errorHandler = (err, req, res, next) => {
  // multer 에러는 400으로 정규화 (500 누출 방지)
  if (err instanceof multer.MulterError) {
    return res.status(400).json({
      success: false,
      message: MULTER_ERROR_MESSAGES[err.code] ?? '파일 업로드 오류가 발생했습니다',
    })
  }

  const status = err.status || 500
  const message = status >= 500
    ? '서버 내부 오류가 발생했습니다'
    : (err.message || '요청 처리에 실패했습니다')

  if (status >= 500) {
    logger.error(`[${req.method}] ${req.path} - ${status}: ${message}`)
    if (env.nodeEnv !== 'production') {
      logger.error(err.stack)
    }
  }

  res.status(status).json({ success: false, message })
}
