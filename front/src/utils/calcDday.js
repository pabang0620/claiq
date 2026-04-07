/**
 * 수능 D-day 계산
 * 수능은 매년 11월 셋째 주 목요일
 */
export function getCSATDate(year) {
  // 11월 1일부터 첫 번째 목요일(4) 찾기
  const nov1 = new Date(year, 10, 1) // 11월 1일
  const dow = nov1.getDay() // 0=일, 1=월, ..., 4=목
  const daysToFirstThursday = (4 - dow + 7) % 7
  const firstThursday = 1 + daysToFirstThursday
  const thirdThursday = firstThursday + 14
  return new Date(year, 10, thirdThursday)
}

export function calcDday(targetDate) {
  const now = new Date()
  const target = new Date(targetDate)
  now.setHours(0, 0, 0, 0)
  target.setHours(0, 0, 0, 0)
  const diffMs = target - now
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24))
}

export function getNextCSATDday() {
  const now = new Date()
  const year = now.getFullYear()
  const csatThisYear = getCSATDate(year)

  if (now <= csatThisYear) {
    return { date: csatThisYear, dday: calcDday(csatThisYear), year }
  }
  const nextYear = year + 1
  const csatNextYear = getCSATDate(nextYear)
  return { date: csatNextYear, dday: calcDday(csatNextYear), year: nextYear }
}

export function formatDday(dday) {
  if (dday === 0) return 'D-DAY'
  if (dday > 0) return `D-${dday}`
  return `D+${Math.abs(dday)}`
}
