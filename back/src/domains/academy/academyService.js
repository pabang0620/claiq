import * as academyRepository from './academyRepository.js'
import * as authRepository from '../auth/authRepository.js'
import { generateAcademyCode } from '../../utils/academyCode.js'

export const createAcademy = async ({ name, address, suneung_date, userId }) => {
  // 고유 코드 생성 (중복 시 재시도)
  let code
  let attempts = 0
  do {
    code = generateAcademyCode()
    const existing = await academyRepository.findAcademyByCode(code)
    if (!existing) break
    attempts++
  } while (attempts < 5)

  const academy = await academyRepository.createAcademy({
    name,
    code,
    address,
    owner_id: userId,
    suneung_date,
  })

  // 학원장을 operator로 자동 등록
  await academyRepository.addMember({
    academy_id: academy.id,
    user_id: userId,
    role: 'operator',
  })

  return academy
}

export const getAcademy = async (id, requestUserId) => {
  const academy = await academyRepository.findAcademyById(id)
  if (!academy) {
    const err = new Error('학원을 찾을 수 없습니다')
    err.status = 404
    throw err
  }
  // IDOR 방지: 본인이 속한 학원만 조회 가능
  if (requestUserId) {
    const membership = await academyRepository.findMembership(id, requestUserId)
    if (!membership || membership.status !== 'active') {
      const err = new Error('접근 권한이 없습니다')
      err.status = 403
      throw err
    }
  }
  return academy
}

export const joinAcademy = async ({ code, userId, userRole }) => {
  const academy = await academyRepository.findAcademyByCode(code)
  if (!academy) {
    const err = new Error('유효하지 않은 학원 코드입니다')
    err.status = 404
    throw err
  }

  const existing = await academyRepository.findMembership(academy.id, userId)
  if (existing && existing.status === 'active') {
    const err = new Error('이미 가입된 학원입니다')
    err.status = 409
    throw err
  }

  const member = await academyRepository.addMember({
    academy_id: academy.id,
    user_id: userId,
    role: userRole,
  })

  return { academy, member }
}

export const getMembers = async (academyId, role = null, requestUserId) => {
  // IDOR 방지: 본인이 속한 학원의 멤버 목록만 조회 가능
  if (requestUserId) {
    const membership = await academyRepository.findMembership(academyId, requestUserId)
    if (!membership || membership.status !== 'active') {
      const err = new Error('접근 권한이 없습니다')
      err.status = 403
      throw err
    }
  }
  return academyRepository.findMembers(academyId, role)
}

export const getMyAcademy = async (userId) => {
  const academies = await academyRepository.findUserAcademies(userId)
  if (!academies.length) {
    const err = new Error('소속된 학원이 없습니다')
    err.status = 404
    throw err
  }
  return academies[0]
}

export const updateMyAcademy = async ({ userId, updates }) => {
  const academies = await academyRepository.findUserAcademies(userId)
  if (!academies.length) {
    const err = new Error('소속된 학원이 없습니다')
    err.status = 404
    throw err
  }
  const academyId = academies[0].id
  return academyRepository.updateAcademy(academyId, updates)
}

export const getMyMembers = async ({ userId, role }) => {
  const academies = await academyRepository.findUserAcademies(userId)
  if (!academies.length) return []
  return academyRepository.findMembers(academies[0].id, role || null)
}

export const inviteMember = async ({ userId, email, role }) => {
  const academies = await academyRepository.findUserAcademies(userId)
  if (!academies.length) {
    const err = new Error('소속된 학원이 없습니다')
    err.status = 404
    throw err
  }

  const targetUser = await authRepository.findUserByEmail(email)
  if (!targetUser) {
    const err = new Error('해당 이메일의 사용자를 찾을 수 없습니다')
    err.status = 404
    throw err
  }

  const academy = academies[0]
  const existing = await academyRepository.findMembership(academy.id, targetUser.id)
  if (existing && existing.status === 'active') {
    const err = new Error('이미 가입된 멤버입니다')
    err.status = 409
    throw err
  }

  const member = await academyRepository.addMember({
    academy_id: academy.id,
    user_id: targetUser.id,
    role: role || targetUser.role,
  })
  return { academy, member }
}

export const removeMember = async ({ operatorId, targetUserId }) => {
  const academies = await academyRepository.findUserAcademies(operatorId)
  if (!academies.length) {
    const err = new Error('소속된 학원이 없습니다')
    err.status = 404
    throw err
  }
  const academyId = academies[0].id
  await academyRepository.removeMember(academyId, targetUserId)
}

export const getMyCoupons = async (userId) => {
  const academies = await academyRepository.findUserAcademies(userId)
  if (!academies.length) return []
  return academyRepository.findCoupons(academies[0].id)
}

export const createCoupon = async ({ userId, couponData }) => {
  const academies = await academyRepository.findUserAcademies(userId)
  if (!academies.length) {
    const err = new Error('소속된 학원이 없습니다')
    err.status = 404
    throw err
  }

  const { name, description, discountType, discountValue, validDays } = couponData
  const expires_at = new Date(Date.now() + validDays * 86400000).toISOString()

  return academyRepository.createCoupon({
    academy_id: academies[0].id,
    name,
    description,
    discount_type: discountType,
    discount_amount: discountValue,
    expires_at,
  })
}

export const updateMemberRole = async ({ operatorId, targetUserId, role }) => {
  const academies = await academyRepository.findUserAcademies(operatorId)
  if (!academies.length) {
    const err = new Error('소속된 학원이 없습니다')
    err.status = 404
    throw err
  }
  const member = await academyRepository.updateMemberRole(academies[0].id, targetUserId, role)
  if (!member) {
    const err = new Error('멤버를 찾을 수 없습니다')
    err.status = 404
    throw err
  }
  return member
}

export const deleteCoupon = async ({ userId, couponId }) => {
  const academies = await academyRepository.findUserAcademies(userId)
  if (!academies.length) {
    const err = new Error('소속된 학원이 없습니다')
    err.status = 404
    throw err
  }
  await academyRepository.deleteCoupon(couponId, academies[0].id)
}
