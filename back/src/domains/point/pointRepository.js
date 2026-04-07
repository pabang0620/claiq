import { pool, withTransaction } from '../../config/db.js'

export const getOrCreatePointBalance = async (userId, client = null) => {
  const db = client || pool
  const { rows } = await db.query(
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

export const addPointTransaction = async ({ userId, academyId, type, amount, balanceAfter, referenceId, idempotencyKey, note, client = null }) => {
  const db = client || pool

  // idempotency_key가 있으면 DB 레벨에서 중복 지급을 원자적으로 방지한다.
  // ON CONFLICT DO NOTHING: 이미 동일 key 행이 있으면 삽입 생략 → RETURNING * 결과가 비어있음
  // 비어있으면 기존 트랜잭션을 조회해서 반환 (중복 지급 방지)
  if (idempotencyKey) {
    const { rows } = await db.query(
      `INSERT INTO point_transactions (user_id, academy_id, type, amount, balance_after, reference_id, idempotency_key, note)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (idempotency_key) DO NOTHING
       RETURNING *`,
      [userId, academyId, type, amount, balanceAfter, referenceId || null, idempotencyKey, note || null]
    )
    if (rows[0]) return rows[0]
    // 삽입이 생략된 경우 - 기존 행을 반환
    const existing = await db.query(
      `SELECT * FROM point_transactions WHERE idempotency_key = $1`,
      [idempotencyKey]
    )
    return existing.rows[0]
  }

  // idempotency_key 없는 경우 (일회성 트랜잭션)
  const { rows } = await db.query(
    `INSERT INTO point_transactions (user_id, academy_id, type, amount, balance_after, reference_id, idempotency_key, note)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [userId, academyId, type, amount, balanceAfter, referenceId || null, null, note || null]
  )
  return rows[0]
}

export const updateBalance = async (userId, newBalance, totalEarned = null, client = null) => {
  const sets = ['balance = $2', 'updated_at = NOW()']
  const params = [userId, newBalance]
  if (totalEarned !== null) {
    sets.push(`total_earned = total_earned + $3`)
    params.push(totalEarned)
  }
  const db = client || pool
  await db.query(
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
