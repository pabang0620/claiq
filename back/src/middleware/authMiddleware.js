import { verifyAccessToken } from '../utils/jwt.js'
import { errorResponse } from '../utils/response.js'

export const authMiddleware = (req, res, next) => {
  try {
    const header = req.headers.authorization
    if (!header || !header.startsWith('Bearer ')) {
      return errorResponse(res, '인증이 필요합니다', 401)
    }
    const token = header.split(' ')[1]
    const decoded = verifyAccessToken(token)
    req.user = decoded
    next()
  } catch {
    return errorResponse(res, '유효하지 않은 토큰입니다', 401)
  }
}
