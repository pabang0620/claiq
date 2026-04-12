import { pool } from '../../config/db.js'

export const findBadgeDefinitions = async () => {
  const { rows } = await pool.query(
    `SELECT * FROM badge_definitions WHERE is_active = true ORDER BY condition_value ASC`
  )
  return rows
}

export const findUserBadges = async (userId) => {
  const { rows } = await pool.query(
    `SELECT ub.*, bd.code, bd.name, bd.description, bd.icon_url, bd.condition_type, bd.condition_value
     FROM user_badges ub
     JOIN badge_definitions bd ON bd.id = ub.badge_id
     WHERE ub.user_id = $1
     ORDER BY ub.earned_at DESC`,
    [userId]
  )
  return rows
}

export const awardBadge = async (userId, badgeId) => {
  const { rows } = await pool.query(
    `INSERT INTO user_badges (user_id, badge_id)
     VALUES ($1, $2)
     ON CONFLICT (user_id, badge_id) DO NOTHING
     RETURNING *`,
    [userId, badgeId]
  )
  return rows[0] || null
}

export const findStreak = async (userId) => {
  const { rows } = await pool.query(
    `SELECT * FROM learning_streaks WHERE user_id = $1`,
    [userId]
  )
  return rows[0] || null
}

export const countAllActiveBadges = async () => {
  const { rows } = await pool.query(
    `SELECT COUNT(*) AS total FROM badge_definitions WHERE is_active = true`
  )
  return parseInt(rows[0]?.total || 0)
}

export const countUserBadges = async (userId) => {
  const { rows } = await pool.query(
    `SELECT COUNT(*) AS total
     FROM user_badges ub
     JOIN badge_definitions bd ON bd.id = ub.badge_id
     WHERE ub.user_id = $1 AND bd.is_active = true`,
    [userId]
  )
  return parseInt(rows[0]?.total || 0)
}

export const upsertStreak = async (userId, currentStreak, longestStreak, lastActiveDate) => {
  const { rows } = await pool.query(
    `INSERT INTO learning_streaks (user_id, current_streak, longest_streak, last_active_date)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (user_id) DO UPDATE
       SET current_streak = $2, longest_streak = $3, last_active_date = $4, updated_at = NOW()
     RETURNING *`,
    [userId, currentStreak, longestStreak, lastActiveDate]
  )
  return rows[0]
}
