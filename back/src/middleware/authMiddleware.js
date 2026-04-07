import { verifyAccessToken } from '../utils/jwt.js'
import { errorResponse } from '../utils/response.js'

export const authMiddleware = (req, res, next) => {
  try {
    const header = req.headers.authorization

    if (!header) {
      return errorResponse(res, '인증 헤더가 없습니다', 401)
    }

    if (!header.startsWith('Bearer ')) {
      return errorResponse(res, 'Bearer 형식의 토큰이 필요합니다', 401)
    }

    const token = header.slice(7).trim()

    if (!token) {
      return errorResponse(res, '토큰이 비어있습니다', 401)
    }

    const decoded = verifyAccessToken(token)
    req.user = decoded
    next()
  } catch {
    return errorResponse(res, '유효하지 않은 토큰입니다', 401)
  }
}
