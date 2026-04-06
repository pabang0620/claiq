import { startWeeklyRoadmapUpdate } from './weeklyRoadmapUpdate.js'
import { startAtRiskDetection } from './atRiskDetection.js'
import { logger } from '../utils/logger.js'

export const startAllJobs = () => {
  startWeeklyRoadmapUpdate()
  startAtRiskDetection()
  logger.info('[JOBS] 모든 크론 잡 시작 완료')
}
