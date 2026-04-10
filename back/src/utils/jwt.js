import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'

// algorithm을 명시적으로 지정해 'none' 알고리즘 공격을 차단한다.
const ACCESS_SIGN_OPTIONS = { expiresIn: env.jwt.expiresIn, algorithm: 'HS256' }
const REFRESH_SIGN_OPTIONS = { expiresIn: env.jwt.refreshExpiresIn, algorithm: 'HS256' }
const ACCESS_VERIFY_OPTIONS = { algorithms: ['HS256'] }
const REFRESH_VERIFY_OPTIONS = { algorithms: ['HS256'] }

export const signAccessToken = (payload) => {
  return jwt.sign(payload, env.jwt.secret, ACCESS_SIGN_OPTIONS)
}

export const signRefreshToken = (payload) => {
  return jwt.sign(payload, env.jwt.refreshSecret, REFRESH_SIGN_OPTIONS)
}

export const verifyAccessToken = (token) => {
  return jwt.verify(token, env.jwt.secret, ACCESS_VERIFY_OPTIONS)
}

export const verifyRefreshToken = (token) => {
  return jwt.verify(token, env.jwt.refreshSecret, REFRESH_VERIFY_OPTIONS)
}
