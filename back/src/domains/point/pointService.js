import * as pointRepository from './pointRepository.js'
import * as academyRepository from '../academy/academyRepository.js'
import { pool, withTransaction } from '../../config/db.js'
import { env } from '../../config/env.js'

export const addPoints = async ({ userId, academyId, type, amount, referenceId, idempotencyKey, note }) => {
  // idempotency 체크
  if (idempotencyKey) {
    const existing = await pointRepository.findTransactionByIdempotencyKey(idempotencyKey)
    if (existing) return existing
  }

  return withTransaction(async (client) => {
    // 잔액 조회 (없으면 생성)
    const pointRow = await pointRepository.getOrCreatePointBalance(userId, client)
    const newBalance = pointRow.balance + amount
    const earned = amount > 0 ? amount : 0

    await pointRepository.updateBalance(userId, newBalance, earned, client)

    const transaction = await pointRepository.addPointTransaction({
      userId,
      academyId,
      type,
      amount,
      balanceAfter: newBalance,
      referenceId,
      idempotencyKey,
      note,
      client,
    })

    return transaction
  })
}

export const getMyPoints = async (userId) => {
  const balance = await pointRepository.getPointBalance(userId)
  const transactions = await pointRepository.findTransactions(userId, 20, 0)
  return {
    balance: balance?.balance || 0,
    total_earned: balance?.total_earned || 0,
    transactions,
  }
}

export const getMyBalance = async (userId) => {
  const balance = await pointRepository.getPointBalance(userId)
  return {
    balance: balance?.balance || 0,
    total_earned: balance?.total_earned || 0,
  }
}

export const getMyTransactions = async ({ userId, page, limit }) => {
  const offset = (page - 1) * limit
  return pointRepository.findTransactions(userId, limit, offset)
}

export const getRewards = async (userId) => {
  const academies = await academyRepository.findUserAcademies(userId)
  if (!academies.length) return []

  const academyId = academies[0].id

  const { rows } = await pool.query(
    `SELECT * FROM academy_coupons
     WHERE academy_id = $1
       AND deleted_at IS NULL
       AND award_condition IS NULL
       AND awarded_to IS NULL
       AND (expires_at IS NULL OR expires_at > NOW())
     ORDER BY created_at DESC`,
    [academyId]
  )

  return rows.map((c) => ({
    id: c.id,
    name: c.name,
    description: c.description,
    discount_type: c.discount_type,
    discount_amount: c.discount_amount,
    expires_at: c.expires_at,
    required_points: env.points.toCoupon,
    type: 'coupon',
  }))
}

export const redeemPoints = async ({ userId, academyId }) => {
  // 잔액 조회를 트랜잭션 밖에서 하면 경쟁 조건이 발생한다.
  // 트랜잭션 내부에서 FOR UPDATE 락을 걸어 원자적으로 처리한다.
  return withTransaction(async (client) => {
    // FOR UPDATE: 동일 user_id에 대한 동시 요청이 직렬화된다.
    const { rows } = await client.query(
      `SELECT balance FROM points WHERE user_id = $1 FOR UPDATE`,
      [userId]
    )
    const currentBalance = rows[0]?.balance ?? 0

    if (currentBalance < env.points.toCoupon) {
      const err = new Error(`포인트가 부족합니다. 쿠폰 교환에는 ${env.points.toCoupon}P가 필요합니다`)
      err.status = 400
      throw err
    }

    const newBalance = currentBalance - env.points.toCoupon
    await pointRepository.updateBalance(userId, newBalance, 0, client)

    const transaction = await pointRepository.addPointTransaction({
      userId,
      academyId,
      type: 'redeem',
      amount: -env.points.toCoupon,
      balanceAfter: newBalance,
      note: '쿠폰으로 교환',
      client,
    })

    return { transaction, couponCount: 1, remainingBalance: newBalance }
  })
}
