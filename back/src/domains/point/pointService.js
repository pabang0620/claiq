import * as pointRepository from './pointRepository.js'
import { withTransaction } from '../../config/db.js'
import { env } from '../../config/env.js'

export const addPoints = async ({ userId, academyId, type, amount, referenceId, idempotencyKey, note }) => {
  // idempotency 체크
  if (idempotencyKey) {
    const existing = await pointRepository.findTransactionByIdempotencyKey(idempotencyKey)
    if (existing) return existing
  }

  return withTransaction(async (client) => {
    // 잔액 조회 (없으면 생성)
    const pointRow = await pointRepository.getOrCreatePointBalance(userId)
    const newBalance = pointRow.balance + amount
    const earned = amount > 0 ? amount : 0

    await pointRepository.updateBalance(userId, newBalance, earned)

    const transaction = await pointRepository.addPointTransaction({
      userId,
      academyId,
      type,
      amount,
      balanceAfter: newBalance,
      referenceId,
      idempotencyKey,
      note,
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

export const redeemPoints = async ({ userId, academyId }) => {
  const balance = await pointRepository.getPointBalance(userId)
  if (!balance || balance.balance < env.points.toCoupon) {
    const err = new Error(`포인트가 부족합니다. 쿠폰 교환에는 ${env.points.toCoupon}P가 필요합니다`)
    err.status = 400
    throw err
  }

  return withTransaction(async () => {
    const newBalance = balance.balance - env.points.toCoupon
    await pointRepository.updateBalance(userId, newBalance, 0)

    const transaction = await pointRepository.addPointTransaction({
      userId,
      academyId,
      type: 'redeem',
      amount: -env.points.toCoupon,
      balanceAfter: newBalance,
      note: '쿠폰으로 교환',
    })

    return { transaction, couponCount: 1, remainingBalance: newBalance }
  })
}
