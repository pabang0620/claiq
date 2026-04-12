import { verifyAccessToken } from '../utils/jwt.js'
import { errorResponse } from '../utils/response.js'

export const authMiddleware = (req, res, next) => {
  try {
    // EventSource(SSE)는 커스텀 헤더를 보낼 수 없어 쿼리파라미터로 토큰 전달
    let token = req.query.token || null

    const header = req.headers.authorization
    if (header) {
      if (!header.startsWith('Bearer ')) {
        return errorResponse(res, 'Bearer 형식의 토큰이 필요합니다', 401)
      }
      token = header.slice(7).trim()
    }

    if (!token) {
      return errorResponse(res, '인증 헤더가 없습니다', 401)
    }

    const decoded = verifyAccessToken(token)
    req.user = decoded
    next()
  } catch {
    return errorResponse(res, '유효하지 않은 토큰입니다', 401)
  }
}
