import * as academyService from './academyService.js'
import { successResponse } from '../../utils/response.js'

export const createAcademy = async (req, res, next) => {
  try {
    const academy = await academyService.createAcademy({
      ...req.body,
      userId: req.user.id,
    })
    return successResponse(res, academy, '학원이 생성되었습니다', 201)
  } catch (err) {
    next(err)
  }
}

export const getAcademy = async (req, res, next) => {
  try {
    const academy = await academyService.getAcademy(req.params.id)
    return successResponse(res, academy)
  } catch (err) {
    next(err)
  }
}

export const joinAcademy = async (req, res, next) => {
  try {
    const result = await academyService.joinAcademy({
      code: req.body.code,
      userId: req.user.id,
      userRole: req.user.role,
    })
    return successResponse(res, result, '학원 가입이 완료되었습니다')
  } catch (err) {
    next(err)
  }
}

export const getMembers = async (req, res, next) => {
  try {
    const { role } = req.query
    const members = await academyService.getMembers(req.params.id, role)
    return successResponse(res, members)
  } catch (err) {
    next(err)
  }
}

export const getMyAcademy = async (req, res, next) => {
  try {
    const academy = await academyService.getMyAcademy(req.user.id)
    return successResponse(res, academy)
  } catch (err) {
    next(err)
  }
}

export const updateMyAcademy = async (req, res, next) => {
  try {
    const academy = await academyService.updateMyAcademy({
      userId: req.user.id,
      updates: req.body,
    })
    return successResponse(res, academy, '학원 정보가 수정되었습니다')
  } catch (err) {
    next(err)
  }
}

export const getMyMembers = async (req, res, next) => {
  try {
    const { role } = req.query
    const members = await academyService.getMyMembers({ userId: req.user.id, role })
    return successResponse(res, members)
  } catch (err) {
    next(err)
  }
}

export const inviteMember = async (req, res, next) => {
  try {
    const result = await academyService.inviteMember({
      userId: req.user.id,
      email: req.body.email,
      role: req.body.role,
    })
    return successResponse(res, result, '초대가 완료되었습니다', 201)
  } catch (err) {
    next(err)
  }
}

export const removeMember = async (req, res, next) => {
  try {
    await academyService.removeMember({
      operatorId: req.user.id,
      targetUserId: req.params.userId,
    })
    return successResponse(res, null, '멤버가 강퇴되었습니다')
  } catch (err) {
    next(err)
  }
}

export const updateMemberRole = async (req, res, next) => {
  try {
    const member = await academyService.updateMemberRole({
      operatorId: req.user.id,
      targetUserId: req.params.userId,
      role: req.body.role,
    })
    return successResponse(res, member, '멤버 역할이 수정되었습니다')
  } catch (err) {
    next(err)
  }
}

export const getMyCoupons = async (req, res, next) => {
  try {
    const coupons = await academyService.getMyCoupons(req.user.id)
    return successResponse(res, coupons)
  } catch (err) {
    next(err)
  }
}

export const createCoupon = async (req, res, next) => {
  try {
    const coupon = await academyService.createCoupon({
      userId: req.user.id,
      couponData: req.body,
    })
    return successResponse(res, coupon, '쿠폰이 생성되었습니다', 201)
  } catch (err) {
    next(err)
  }
}

export const deleteCoupon = async (req, res, next) => {
  try {
    await academyService.deleteCoupon({
      userId: req.user.id,
      couponId: req.params.id,
    })
    return successResponse(res, null, '쿠폰이 삭제되었습니다')
  } catch (err) {
    next(err)
  }
}
