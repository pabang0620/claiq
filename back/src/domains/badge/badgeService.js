import * as badgeRepository from './badgeRepository.js'
import * as pointService from '../point/pointService.js'

export const getMyBadges = async (userId) => {
  return badgeRepository.findUserBadges(userId)
}

export const checkAndAwardBadges = async ({ userId, academyId, stats }) => {
  const definitions = await badgeRepository.findBadgeDefinitions()
  const userBadges = await badgeRepository.findUserBadges(userId)
  const earnedIds = new Set(userBadges.map((b) => b.badge_id))

  const newBadges = []

  for (const def of definitions) {
    if (earnedIds.has(def.id)) continue

    let qualified = false

    switch (def.condition_type) {
      case 'streak_days':
        qualified = (stats.current_streak || 0) >= def.condition_value
        break
      case 'quiz_count':
        qualified = (stats.total_quizzes || 0) >= def.condition_value
        break
      case 'correct_rate':
        qualified = (stats.correct_rate || 0) >= def.condition_value / 100
        break
      case 'perfect_count':
        qualified = (stats.perfect_exams || 0) >= def.condition_value
        break
      case 'qa_count':
        qualified = (stats.qa_count || 0) >= def.condition_value
        break
      case 'monthly_attendance':
        qualified = (stats.monthly_attendance || 0) >= def.condition_value
        break
    }

    if (qualified) {
      const awarded = await badgeRepository.awardBadge(userId, def.id)
      if (awarded) {
        newBadges.push(def)
        // 뱃지 획득 포인트 지급
        await pointService.addPoints({
          userId,
          academyId,
          type: 'badge_earned',
          amount: def.points_reward,
          referenceId: def.id,
          idempotencyKey: `badge:${userId}:${def.id}`,
          note: `뱃지 획득: ${def.name}`,
        }).catch(() => {})
      }
    }
  }

  return newBadges
}
