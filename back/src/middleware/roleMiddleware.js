import { errorResponse } from '../utils/response.js'

/**
 * roles: string[] - 허용할 역할 목록
 * 예: requireRole('teacher', 'operator')
 */
export const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) {
    return errorResponse(res, '인증이 필요합니다', 401)
  }
  if (!roles.includes(req.user.role)) {
    return errorResponse(res, '접근 권한이 없습니다', 403)
  }
  next()
}
