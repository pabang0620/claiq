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
