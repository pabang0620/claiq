import crypto from 'crypto'

// 영문 대문자 + 숫자 조합 6자리 (예: 'A3BX7Z')
// 36^6 = 약 21억 가지 경우의 수 → 충분한 엔트로피
// DB 중복 검사 및 재시도 로직은 academyService.createAcademy 에서 담당한다.
const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'

/**
 * 암호학적으로 안전한 난수를 사용해 대문자+숫자 조합 코드를 생성한다.
 * @param {number} length - 코드 길이 (기본 6)
 * @returns {string} 예: 'A3BX7Z'
 */
export const generateAcademyCode = (length = 6) => {
  const bytes = crypto.randomBytes(length)
  return Array.from(bytes)
    .map((b) => CHARS[b % CHARS.length])
    .join('')
}

/**
 * 코드 형식 유효성 검사 - 대문자+숫자 6자리인지 확인
 * @param {string} code
 * @returns {boolean}
 */
export const isValidAcademyCode = (code) =>
  typeof code === 'string' && /^[A-Z0-9]{6}$/.test(code)
