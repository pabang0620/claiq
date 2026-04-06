import { Router } from 'express'
import { z } from 'zod'
import { validate } from '../../middleware/validate.js'
import { authLimiter } from '../../middleware/rateLimiter.js'
import { authMiddleware } from '../../middleware/authMiddleware.js'
import * as authController from './authController.js'

const router = Router()

const signupSchema = z.object({
  email: z.string().email('올바른 이메일을 입력하세요'),
  password: z.string().min(8, '비밀번호는 8자 이상이어야 합니다'),
  name: z.string().min(1, '이름을 입력하세요').max(100),
  role: z.enum(['teacher', 'student', 'operator'], { message: '유효하지 않은 역할입니다' }),
  phone: z.string().optional(),
})

const loginSchema = z.object({
  email: z.string().email('올바른 이메일을 입력하세요'),
  password: z.string().min(1, '비밀번호를 입력하세요'),
})

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, '현재 비밀번호를 입력하세요'),
  newPassword: z.string().min(8, '새 비밀번호는 8자 이상이어야 합니다'),
})

router.post('/signup', authLimiter, validate(signupSchema), authController.signup)
router.post('/login', authLimiter, validate(loginSchema), authController.login)
router.post('/refresh', authController.refresh)
router.post('/logout', authController.logout)
router.get('/me', authController.me)
router.patch('/password', authMiddleware, validate(changePasswordSchema), authController.changePassword)

export default router
