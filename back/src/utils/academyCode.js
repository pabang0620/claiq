import crypto from 'crypto'

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'

export const generateAcademyCode = (length = 6) => {
  const bytes = crypto.randomBytes(length)
  return Array.from(bytes)
    .map((b) => CHARS[b % CHARS.length])
    .join('')
}
