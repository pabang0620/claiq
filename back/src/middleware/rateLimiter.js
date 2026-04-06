import rateLimit from 'express-rate-limit'

const isTest = process.env.NODE_ENV === 'test'

export const defaultLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isTest ? 1_000_000 : 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: '요청이 너무 많습니다. 잠시 후 시도해주세요.' },
  skip: () => isTest,
})

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isTest ? 1_000_000 : 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: '로그인 시도가 너무 많습니다. 15분 후 다시 시도해주세요.' },
  skipSuccessfulRequests: true,
  skip: () => isTest,
})

export const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: isTest ? 1_000_000 : 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'AI 요청이 너무 많습니다. 잠시 후 시도해주세요.' },
  skip: () => isTest,
})
