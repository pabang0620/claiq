import * as pointService from './pointService.js'
import * as badgeService from '../badge/badgeService.js'
import * as badgeRepository from '../badge/badgeRepository.js'
import { successResponse } from '../../utils/response.js'

export const getMyPoints = async (req, res, next) => {
  try {
    const data = await pointService.getMyPoints(req.user.id)
    return successResponse(res, data)
  } catch (err) {
    next(err)
  }
}

export const getMyBalance = async (req, res, next) => {
  try {
    const data = await pointService.getMyBalance(req.user.id)
    return successResponse(res, data)
  } catch (err) {
    next(err)
  }
}

export const getMyTransactions = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query
    const data = await pointService.getMyTransactions({
      userId: req.user.id,
      page: Number(page),
      limit: Math.min(Number(limit), 100),
    })
    return successResponse(res, data)
  } catch (err) {
    next(err)
  }
}

export const getMyBadges = async (req, res, next) => {
  try {
    const badges = await badgeService.getMyBadges(req.user.id)
    return successResponse(res, badges)
  } catch (err) {
    next(err)
  }
}

export const getMyStreak = async (req, res, next) => {
  try {
    const streak = await badgeRepository.findStreak(req.user.id)
    return successResponse(res, streak || { current_streak: 0, longest_streak: 0, last_active_date: null })
  } catch (err) {
    next(err)
  }
}

export const redeemPoints = async (req, res, next) => {
  try {
    const result = await pointService.redeemPoints({
      userId: req.user.id,
      academyId: req.query.academy_id || null,
    })
    return successResponse(res, result, '쿠폰으로 교환되었습니다')
  } catch (err) {
    next(err)
  }
}

export const getRewards = async (req, res, next) => {
  try {
    const rewards = await pointService.getRewards()
    return successResponse(res, rewards)
  } catch (err) {
    next(err)
  }
}
