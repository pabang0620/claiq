import * as pointService from './pointService.js'
import { successResponse } from '../../utils/response.js'

export const getMyPoints = async (req, res, next) => {
  try {
    const data = await pointService.getMyPoints(req.user.id)
    return successResponse(res, data)
  } catch (err) {
    next(err)
  }
}

export const redeemPoints = async (req, res, next) => {
  try {
    const result = await pointService.redeemPoints({
      userId: req.user.id,
      academyId: req.body.academy_id,
    })
    return successResponse(res, result, '쿠폰으로 교환되었습니다')
  } catch (err) {
    next(err)
  }
}
