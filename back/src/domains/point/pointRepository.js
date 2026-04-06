import { pool, withTransaction } from '../../config/db.js'

export const getOrCreatePointBalance = async (userId) => {
  const { rows } = await pool.query(
    `INSERT INTO points (user_id, balance)
     VALUES ($1, 0)
     ON CONFLICT (user_id) DO UPDATE SET user_id = EXCLUDED.user_id
     RETURNING *`,
    [userId]
  )
  return rows[0]
}

export const getPointBalance = async (userId) => {
  const { rows } = await pool.query(
    `SELECT * FROM points WHERE user_id = $1`,
    [userId]
  )
  return rows[0] || null
}

export const addPointTransaction = async ({ userId, academyId, type, amount, balanceAfter, referenceId, idempotencyKey, note }) => {
  const { rows } = await pool.query(
    `INSERT INTO point_transactions (user_id, academy_id, type, amount, balance_after, reference_id, idempotency_key, note)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [userId, academyId, type, amount, balanceAfter, referenceId || null, idempotencyKey || null, note || null]
  )
  return rows[0]
}

export const updateBalance = async (userId, newBalance, totalEarned = null) => {
  const sets = ['balance = $2', 'updated_at = NOW()']
  const params = [userId, newBalance]
  if (totalEarned !== null) {
    sets.push(`total_earned = total_earned + $3`)
    params.push(totalEarned)
  }
  await pool.query(
    `UPDATE points SET ${sets.join(', ')} WHERE user_id = $1`,
    params
  )
}

export const findTransactionByIdempotencyKey = async (key) => {
  const { rows } = await pool.query(
    `SELECT * FROM point_transactions WHERE idempotency_key = $1`,
    [key]
  )
  return rows[0] || null
}

export const findTransactions = async (userId, limit = 20, offset = 0) => {
  const { rows } = await pool.query(
    `SELECT * FROM point_transactions
     WHERE user_id = $1
     ORDER BY created_at DESC
     LIMIT $2 OFFSET $3`,
    [userId, limit, offset]
  )
  return rows
}
