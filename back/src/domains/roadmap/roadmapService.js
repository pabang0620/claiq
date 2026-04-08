import * as roadmapRepository from './roadmapRepository.js'
import * as questionRepository from '../question/questionRepository.js'
import * as academyRepository from '../academy/academyRepository.js'
import { generateRoadmap } from '../../ai/roadmapGenerator.js'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const suneungTypes = JSON.parse(
  readFileSync(join(__dirname, '../../data/suneung_types.json'), 'utf-8')
)

const getAllTypeWeights = () => {
  const result = {}
  for (const area of Object.values(suneungTypes)) {
    for (const [code, info] of Object.entries(area)) {
      result[code] = info.weight
    }
  }
  return result
}

export const getMyRoadmap = async (studentId) => {
  const roadmap = await roadmapRepository.findCurrentRoadmap(studentId)
  if (!roadmap) {
    const err = new Error('로드맵이 아직 생성되지 않았습니다')
    err.status = 404
    throw err
  }
  return roadmap
}

export const updateItem = async ({ itemId, status, userId }) => {
  const item = await roadmapRepository.updateItemStatus(itemId, status, userId)
  if (!item) {
    const err = new Error('로드맵 항목을 찾을 수 없습니다')
    err.status = 404
    throw err
  }
  return item
}

export const generateStudentRoadmap = async ({ studentId, academyId, studentName }) => {
  // 취약 유형 조회
  const typeStats = await questionRepository.findTypeStats(studentId, academyId)

  // 학원 정보 (수능일)
  const academies = await academyRepository.findUserAcademies(studentId)
  const academy = academies.find((a) => a.id === academyId) || academies[0]
  const suneungDate = academy?.suneung_date ? new Date(academy.suneung_date) : new Date('2026-11-19')
  const today = new Date()
  const ddayCount = Math.max(1, Math.floor((suneungDate - today) / (1000 * 60 * 60 * 24)))

  const typeWeights = getAllTypeWeights()

  // 취약 유형 우선순위 (정답률 낮은 순 + 수능 출제 빈도 가중치)
  const weakTypes = typeStats
    .map((s) => ({
      ...s,
      frequency_weight: typeWeights[s.type_code] || 0.5,
      priority_score: (1 - (s.correct_rate || 0)) * (typeWeights[s.type_code] || 0.5),
    }))
    .sort((a, b) => b.priority_score - a.priority_score)

  // GPT 로드맵 생성
  const { summary, items } = await generateRoadmap({
    weakTypes,
    ddayCount,
    studentName: studentName || '학생',
  })

  const nextMonday = new Date()
  // getDay(): 0=일, 1=월 ... 6=토. 오늘이 월요일(1)이면 7일 후 다음 월요일.
  const daysUntilMonday = nextMonday.getDay() === 1 ? 7 : (8 - nextMonday.getDay()) % 7
  nextMonday.setDate(nextMonday.getDate() + daysUntilMonday)

  const roadmap = await roadmapRepository.createRoadmap({
    student_id: studentId,
    academy_id: academyId,
    dday_count: ddayCount,
    suneung_date: suneungDate.toISOString().split('T')[0],
    summary,
    items,
    expires_at: nextMonday.toISOString(),
  })

  return roadmap
}
