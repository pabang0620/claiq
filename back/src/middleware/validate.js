import { errorResponse } from '../utils/response.js'

export const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body)
  if (!result.success) {
    return errorResponse(res, '입력값이 올바르지 않습니다', 400, result.error.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    })))
  }
  req.body = result.data
  next()
}

export const validateQuery = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.query)
  if (!result.success) {
    return errorResponse(res, '쿼리 파라미터가 올바르지 않습니다', 400, result.error.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    })))
  }
  req.query = result.data
  next()
}
