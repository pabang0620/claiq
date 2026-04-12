import * as authService from './authService.js'
import { successResponse, errorResponse } from '../../utils/response.js'

export const signup = async (req, res, next) => {
  try {
    const { user, accessToken, refreshToken, academyCode } = await authService.signup(req.body)
    res.cookie('refreshToken', refreshToken, authService.REFRESH_COOKIE_OPTIONS)
    return successResponse(res, { user, accessToken, academyCode }, '회원가입이 완료되었습니다', 201)
  } catch (err) {
    next(err)
  }
}

export const login = async (req, res, next) => {
  try {
    const { user, accessToken, refreshToken } = await authService.login(req.body)
    res.cookie('refreshToken', refreshToken, authService.REFRESH_COOKIE_OPTIONS)
    return successResponse(res, { user, accessToken }, '로그인 성공')
  } catch (err) {
    next(err)
  }
}

export const refresh = async (req, res, next) => {
  try {
    const token = req.cookies?.refreshToken
    if (!token) {
      return errorResponse(res, '리프레시 토큰이 없습니다', 401)
    }
    const { accessToken, refreshToken } = await authService.refresh(token)
    res.cookie('refreshToken', refreshToken, authService.REFRESH_COOKIE_OPTIONS)
    return successResponse(res, { accessToken }, '토큰 갱신 성공')
  } catch (err) {
    next(err)
  }
}

export const logout = async (req, res, next) => {
  try {
    const token = req.cookies?.refreshToken
    await authService.logout(token)
    res.clearCookie('refreshToken', { path: '/' })
    return successResponse(res, null, '로그아웃 완료')
  } catch (err) {
    next(err)
  }
}

export const me = async (req, res, next) => {
  try {
    const token = req.cookies?.refreshToken
    const { user, accessToken } = await authService.me(token)
    return successResponse(res, { user, accessToken })
  } catch (err) {
    next(err)
  }
}

export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body
    await authService.changePassword({
      userId: req.user.id,
      currentPassword,
      newPassword,
    })
    return successResponse(res, null, '비밀번호가 변경되었습니다')
  } catch (err) {
    next(err)
  }
}
