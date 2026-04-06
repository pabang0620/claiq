import * as badgeService from './badgeService.js'
import { successResponse } from '../../utils/response.js'

export const getMyBadges = async (req, res, next) => {
  try {
    const badges = await badgeService.getMyBadges(req.user.id)
    return successResponse(res, badges)
  } catch (err) {
    next(err)
  }
}
