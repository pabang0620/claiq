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

export const getAcademy = async (id) => {
  const academy = await academyRepository.findAcademyById(id)
  if (!academy) {
    const err = new Error('학원을 찾을 수 없습니다')
    err.status = 404
    throw err
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

export const getMembers = async (academyId, role = null) => {
  return academyRepository.findMembers(academyId, role)
}
