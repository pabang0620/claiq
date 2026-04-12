import * as badgeRepository from './badgeRepository.js'
import * as pointService from '../point/pointService.js'
import { pool } from '../../config/db.js'

export const getMyBadges = async (userId) => {
  return badgeRepository.findUserBadges(userId)
}

const ALL_COMPLETE_REWARD_POINTS = 500

export const claimAllCompleteReward = async ({ userId, academyId }) => {
  const [totalBadges, userBadgeCount] = await Promise.all([
    badgeRepository.countAllActiveBadges(),
    badgeRepository.countUserBadges(userId),
  ])

  if (totalBadges === 0 || userBadgeCount < totalBadges) {
    const err = new Error('아직 모든 뱃지를 획득하지 못했습니다.')
    err.status = 400
    throw err
  }

  const idempotencyKey = `badge_all_complete:${userId}`

  // pointService.addPoints는 idempotencyKey가 이미 존재하면
  // 새 지급 없이 기존 트랜잭션 레코드를 반환한다.
  // created_at이 현재 시각과 다르면 이미 수령한 것으로 판단한다.
  const transaction = await pointService.addPoints({
    userId,
    academyId,
    type: 'badge_all_complete',
    amount: ALL_COMPLETE_REWARD_POINTS,
    idempotencyKey,
    note: '모든 뱃지 달성 보상',
  })

  // addPoints 내부에서 idempotency 중복 시 기존 레코드를 반환한다.
  // 트랜잭션 생성 시각과 현재 시각 비교로 신규/기존 수령 여부를 판단한다.
  const createdAt = new Date(transaction.created_at)
  const isAlreadyClaimed = Date.now() - createdAt.getTime() > 5000

  return {
    points: ALL_COMPLETE_REWARD_POINTS,
    alreadyClaimed: isAlreadyClaimed,
    message: isAlreadyClaimed ? '이미 보상을 받으셨습니다.' : '모든 뱃지 달성 보상!',
  }
}

const fetchUserStats = async (userId) => {
  const [quizResult, streakResult, examResult, qaResult, attendanceResult] = await Promise.all([
    // 총 문제 풀이 수 및 정답률
    pool.query(
      `SELECT
         COUNT(*) AS total_quizzes,
         CASE WHEN COUNT(*) = 0 THEN 0
              ELSE ROUND(SUM(CASE WHEN is_correct THEN 1 ELSE 0 END) * 100.0 / COUNT(*))
         END AS correct_rate
       FROM answer_submissions
       WHERE student_id = $1`,
      [userId]
    ),
    // 현재 스트릭
    pool.query(
      `SELECT current_streak FROM learning_streaks WHERE user_id = $1`,
      [userId]
    ),
    // 완료된 모의고사 수
    pool.query(
      `SELECT COUNT(*) AS exam_count FROM mini_exams WHERE student_id = $1 AND status = 'graded'`,
      [userId]
    ),
    // AI Q&A 세션 수
    pool.query(
      `SELECT COUNT(*) AS qa_count FROM qa_sessions WHERE student_id = $1`,
      [userId]
    ),
    // 이번 달 출석 수
    pool.query(
      `SELECT COUNT(*) AS monthly_attendance
       FROM attendances
       WHERE student_id = $1
         AND status IN ('present', 'late')
         AND marked_at >= date_trunc('month', NOW() AT TIME ZONE 'Asia/Seoul') AT TIME ZONE 'Asia/Seoul'`,
      [userId]
    ),
  ])

  return {
    total_quizzes: parseInt(quizResult.rows[0]?.total_quizzes || 0),
    correct_rate: parseInt(quizResult.rows[0]?.correct_rate || 0),
    current_streak: parseInt(streakResult.rows[0]?.current_streak || 0),
    perfect_exams: parseInt(examResult.rows[0]?.exam_count || 0),
    qa_count: parseInt(qaResult.rows[0]?.qa_count || 0),
    monthly_attendance: parseInt(attendanceResult.rows[0]?.monthly_attendance || 0),
  }
}

export const checkAndAwardBadges = async ({ userId, academyId, stats: passedStats }) => {
  const definitions = await badgeRepository.findBadgeDefinitions()
  if (!definitions.length) return []

  const userBadges = await badgeRepository.findUserBadges(userId)
  const earnedIds = new Set(userBadges.map((b) => b.badge_id))

  // 아직 획득하지 않은 뱃지가 없으면 조기 종료
  const unearned = definitions.filter((d) => !earnedIds.has(d.id))
  if (!unearned.length) return []

  const stats = passedStats || (await fetchUserStats(userId))
  const newBadges = []

  for (const def of unearned) {
    let qualified = false

    switch (def.condition_type) {
      case 'streak_days':
        qualified = (stats.current_streak || 0) >= def.condition_value
        break
      case 'quiz_count':
        qualified = (stats.total_quizzes || 0) >= def.condition_value
        break
      case 'correct_rate':
        // condition_value는 정수 (예: 100), stats.correct_rate도 정수(%) 기준으로 통일
        qualified = (stats.correct_rate || 0) >= def.condition_value
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
