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

export const claimAllCompleteReward = async (req, res, next) => {
  try {
    const result = await badgeService.claimAllCompleteReward({
      userId: req.user.id,
      academyId: req.user.academyId,
    })
    return successResponse(res, result)
  } catch (err) {
    next(err)
  }
}
