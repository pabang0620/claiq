import * as examRepository from './examRepository.js'
import * as questionRepository from '../question/questionRepository.js'
import { generateExam } from '../../ai/examGenerator.js'
import { getChunksByLectureId } from '../lecture/vectorRepository.js'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { pool } from '../../config/db.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const suneungTypes = JSON.parse(
  readFileSync(join(__dirname, '../../data/suneung_types.json'), 'utf-8')
)

export const generateStudentExam = async ({ studentId, academyId, subjectId, area }) => {
  // 취약 유형 조회
  const typeStats = await questionRepository.findTypeStats(studentId, academyId)
  const weakTypes = typeStats.filter((s) => s.subject_area === area || !area)
    .sort((a, b) => a.correct_rate - b.correct_rate)

  // 전체 유형 목록
  const areaKey = area === '국어' ? 'KOR' : area === '수학' ? 'MATH' : 'ENG'
  const allTypes = Object.entries(suneungTypes[areaKey] || {}).map(([code, info]) => ({
    type_code: code,
    type_name: info.name,
  }))

  // 최근 강의 청크 가져오기
  const { rows: recentLectures } = await pool.query(
    `SELECT id FROM lectures
     WHERE academy_id = $1 AND subject_id = $2 AND processing_status = 'done' AND deleted_at IS NULL
     ORDER BY created_at DESC LIMIT 3`,
    [academyId, subjectId]
  )

  let availableChunks = []
  for (const lecture of recentLectures) {
    const chunks = await getChunksByLectureId(lecture.id)
    availableChunks.push(...chunks.map((c) => c.content))
  }

  const questions = await generateExam({
    weakTypes,
    allTypes,
    area: area || '국어',
    availableChunks,
  })

  return examRepository.createExam({
    student_id: studentId,
    academy_id: academyId,
    subject_id: subjectId,
    questions,
  })
}

export const submitExam = async ({ examId, studentId, answers }) => {
  const exam = await examRepository.findExamById(examId)
  if (!exam) {
    const err = new Error('모의고사를 찾을 수 없습니다')
    err.status = 404
    throw err
  }
  if (exam.student_id !== studentId) {
    const err = new Error('접근 권한이 없습니다')
    err.status = 403
    throw err
  }
  if (exam.status === 'graded') {
    const err = new Error('이미 제출된 모의고사입니다')
    err.status = 400
    throw err
  }
  return examRepository.submitExam({ exam_id: examId, student_id: studentId, answers })
}

export const getExamStatus = async (examId) => {
  const exam = await examRepository.findExamById(examId)
  if (!exam) {
    const err = new Error('모의고사를 찾을 수 없습니다')
    err.status = 404
    throw err
  }
  // generating: 문항이 없거나 status가 pending, ready: 문항이 있고 graded가 아닌 경우
  const status = !exam.questions || exam.questions.length === 0 ? 'generating' : 'ready'
  return { id: exam.id, status, questionCount: exam.questions?.length || 0, examStatus: exam.status }
}

export const getMyHistory = async ({ userId, page, limit }) => {
  const offset = (page - 1) * limit
  return examRepository.findExamHistory(userId, limit, offset)
}

export const getExamReport = async ({ examId, userId }) => {
  const report = await examRepository.findExamReport(examId)
  if (!report) {
    const err = new Error('모의고사를 찾을 수 없습니다')
    err.status = 404
    throw err
  }
  if (report.exam.student_id !== userId) {
    const err = new Error('접근 권한이 없습니다')
    err.status = 403
    throw err
  }
  return report
}
