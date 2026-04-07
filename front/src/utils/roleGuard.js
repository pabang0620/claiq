import { ROLES } from '../constants/roles.js'

export function hasRole(user, role) {
  if (!user) return false
  return user.role === role
}

export function isTeacher(user) {
  return hasRole(user, ROLES.TEACHER)
}

export function isStudent(user) {
  return hasRole(user, ROLES.STUDENT)
}

export function isOperator(user) {
  return hasRole(user, ROLES.OPERATOR)
}

export function getDashboardPath(role) {
  switch (role) {
    case ROLES.TEACHER: return '/teacher'
    case ROLES.STUDENT: return '/student'
    case ROLES.OPERATOR: return '/operator'
    default: return '/login'
  }
}
