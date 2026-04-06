export const CHART_COLORS = {
  primary: '#7c3aed',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#3b82f6',
}

export function getScoreColor(pct) {
  if (pct >= 80) return CHART_COLORS.success
  if (pct >= 60) return CHART_COLORS.warning
  return CHART_COLORS.danger
}
