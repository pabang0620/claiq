export const SUBJECTS = [
  { code: 'korean', label: '국어', active: true },
  { code: 'math', label: '수학', active: true },
  { code: 'english', label: '영어', active: true },
  { code: 'history', label: '한국사', active: false },
  { code: 'science', label: '과학탐구', active: false },
  { code: 'social', label: '사회탐구', active: false },
]

export const ACTIVE_SUBJECTS = SUBJECTS.filter((s) => s.active)

export const SUBJECT_LABELS = SUBJECTS.reduce((acc, s) => {
  acc[s.code] = s.label
  return acc
}, {})
