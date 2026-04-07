export function formatPoint(point) {
  if (point === null || point === undefined) return '0'
  return Number(point).toLocaleString('ko-KR')
}

export function formatPointWithUnit(point) {
  return `${formatPoint(point)}P`
}
