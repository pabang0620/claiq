import * as roadmapService from './roadmapService.js'
import { successResponse } from '../../utils/response.js'

export const getMyRoadmap = async (req, res, next) => {
  try {
    const roadmap = await roadmapService.getMyRoadmap(req.user.id)
    return successResponse(res, roadmap)
  } catch (err) {
    next(err)
  }
}

export const regenerate = async (req, res, next) => {
  try {
    const { academy_id } = req.body
    // JWT payload에 name이 없으므로 DB에서 조회하거나 undefined로 넘김 (service에서 기본값 '학생' 사용)
    const roadmap = await roadmapService.generateStudentRoadmap({
      studentId: req.user.id,
      academyId: academy_id,
      studentName: undefined,
    })
    return successResponse(res, roadmap, '로드맵이 재생성되었습니다')
  } catch (err) {
    next(err)
  }
}

export const updateItem = async (req, res, next) => {
  try {
    const item = await roadmapService.updateItem({
      itemId: req.params.itemId,
      status: req.body.status,
      userId: req.user.id,
    })
    return successResponse(res, item, '로드맵 항목이 업데이트되었습니다')
  } catch (err) {
    next(err)
  }
}
