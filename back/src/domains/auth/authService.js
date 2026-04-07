import * as authRepository from './authRepository.js'
import { createAcademy, addMember } from '../academy/academyRepository.js'
import { generateAcademyCode } from '../../utils/academyCode.js'
import { hashPassword, comparePassword } from '../../utils/bcrypt.js'
import { signAccessToken, signRefreshToken } from '../../utils/jwt.js'
import { env } from '../../config/env.js'

const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: env.nodeEnv === 'production',
  sameSite: 'strict',
  maxAge: 30 * 24 * 60 * 60 * 1000, // 30일
  path: '/',
}

const makeRefreshExpiry = () => {
  const d = new Date()
  d.setDate(d.getDate() + 30)
  return d
}

export const signup = async ({ email, password, name, role, phone, academyName }) => {
  const existing = await authRepository.findUserByEmail(email)
  if (existing) {
    const err = new Error('이미 사용 중인 이메일입니다')
    err.status = 409
    throw err
  }

  const password_hash = await hashPassword(password)
  const user = await authRepository.createUser({ email, password_hash, name, role, phone })

  if (role === 'operator' && academyName) {
    const code = generateAcademyCode()
    const academy = await createAcademy({ name: academyName, code, owner_id: user.id })
    await addMember({ academy_id: academy.id, user_id: user.id, role: 'operator' })
  }

  const accessToken = signAccessToken({ id: user.id, email: user.email, role: user.role })
  const refreshToken = signRefreshToken({ id: user.id })

  await authRepository.saveRefreshToken(user.id, refreshToken, makeRefreshExpiry())

  return { user, accessToken, refreshToken }
}

export const login = async ({ email, password }) => {
  const user = await authRepository.findUserByEmail(email)
  if (!user) {
    const err = new Error('이메일 또는 비밀번호가 올바르지 않습니다')
    err.status = 401
    throw err
  }

  if (!user.is_active) {
    const err = new Error('비활성화된 계정입니다')
    err.status = 403
    throw err
  }

  const valid = await comparePassword(password, user.password_hash)
  if (!valid) {
    const err = new Error('이메일 또는 비밀번호가 올바르지 않습니다')
    err.status = 401
    throw err
  }

  const accessToken = signAccessToken({ id: user.id, email: user.email, role: user.role })
  const refreshToken = signRefreshToken({ id: user.id })

  await authRepository.saveRefreshToken(user.id, refreshToken, makeRefreshExpiry())

  const { password_hash: _, ...safeUser } = user
  return { user: safeUser, accessToken, refreshToken }
}

export const refresh = async (refreshToken) => {
  const record = await authRepository.findRefreshToken(refreshToken)
  if (!record) {
    const err = new Error('유효하지 않은 리프레시 토큰입니다')
    err.status = 401
    throw err
  }

  if (record.revoked_at) {
    const err = new Error('만료된 리프레시 토큰입니다')
    err.status = 401
    throw err
  }

  if (new Date(record.expires_at) < new Date()) {
    const err = new Error('리프레시 토큰이 만료되었습니다')
    err.status = 401
    throw err
  }

  if (!record.is_active) {
    const err = new Error('비활성화된 계정입니다')
    err.status = 403
    throw err
  }

  // 토큰 로테이션
  await authRepository.revokeRefreshToken(refreshToken)
  const newAccessToken = signAccessToken({ id: record.user_id, email: record.email, role: record.role })
  const newRefreshToken = signRefreshToken({ id: record.user_id })
  await authRepository.saveRefreshToken(record.user_id, newRefreshToken, makeRefreshExpiry())

  return { accessToken: newAccessToken, refreshToken: newRefreshToken }
}

export const logout = async (refreshToken) => {
  if (refreshToken) {
    await authRepository.revokeRefreshToken(refreshToken)
  }
}

export const me = async (refreshToken) => {
  if (!refreshToken) {
    const err = new Error('리프레시 토큰이 없습니다')
    err.status = 401
    throw err
  }

  const record = await authRepository.findRefreshToken(refreshToken)
  if (!record) {
    const err = new Error('유효하지 않은 리프레시 토큰입니다')
    err.status = 401
    throw err
  }
  if (record.revoked_at) {
    const err = new Error('만료된 리프레시 토큰입니다')
    err.status = 401
    throw err
  }
  if (new Date(record.expires_at) < new Date()) {
    const err = new Error('리프레시 토큰이 만료되었습니다')
    err.status = 401
    throw err
  }
  if (!record.is_active) {
    const err = new Error('비활성화된 계정입니다')
    err.status = 403
    throw err
  }

  const user = await authRepository.findUserById(record.user_id)
  const accessToken = signAccessToken({ id: record.user_id, email: record.email, role: record.role })

  return { user, accessToken }
}

export const changePassword = async ({ userId, currentPassword, newPassword }) => {
  const user = await authRepository.findUserByIdWithPassword(userId)
  if (!user) {
    const err = new Error('사용자를 찾을 수 없습니다')
    err.status = 404
    throw err
  }

  const valid = await comparePassword(currentPassword, user.password_hash)
  if (!valid) {
    const err = new Error('현재 비밀번호가 올바르지 않습니다')
    err.status = 400
    throw err
  }

  const newHash = await hashPassword(newPassword)
  await authRepository.updatePassword(userId, newHash)
  // 기존 리프레시 토큰 전체 무효화
  await authRepository.revokeAllUserRefreshTokens(userId)
}

export { REFRESH_COOKIE_OPTIONS }
