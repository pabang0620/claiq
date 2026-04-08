import * as examRepository from './examRepository.js'
import * as questionRepository from '../question/questionRepository.js'
import { findUserAcademies } from '../academy/academyRepository.js'
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
  // academy_id가 없으면 학생 소속 학원 자동 조회
  let resolvedAcademyId = academyId
  if (!resolvedAcademyId) {
    const academies = await findUserAcademies(studentId)
    if (academies.length > 0) {
      resolvedAcademyId = academies[0].id
    }
  }

  // subject_id가 없으면 학원에서 사용 중인 첫 번째 과목을 자동 조회
  let resolvedSubjectId = subjectId
  if (!resolvedSubjectId && resolvedAcademyId) {
    const { rows: subjectRows } = await pool.query(
      `SELECT DISTINCT q.subject_id FROM questions q
       WHERE q.academy_id = $1 AND q.deleted_at IS NULL
       LIMIT 1`,
      [resolvedAcademyId]
    )
    if (subjectRows.length > 0) {
      resolvedSubjectId = subjectRows[0].subject_id
    } else {
      // questions가 없으면 subjects 마스터에서 첫 번째 활성 과목 선택
      const { rows: masterRows } = await pool.query(
        `SELECT id FROM subjects WHERE is_active = true ORDER BY display_order ASC LIMIT 1`
      )
      if (masterRows.length > 0) resolvedSubjectId = masterRows[0].id
    }
  }

  // 취약 유형 조회
  const typeStats = await questionRepository.findTypeStats(studentId, resolvedAcademyId)
  const weakTypes = typeStats.filter((s) => s.subject_area === area || !area)
    .sort((a, b) => a.correct_rate - b.correct_rate)

  // 전체 유형 목록
  const areaKey = area === '국어' ? 'KOR' : area === '수학' ? 'MATH' : 'ENG'
  const allTypes = Object.entries(suneungTypes[areaKey] || {}).map(([code, info]) => ({
    type_code: code,
    type_name: info.name,
  }))

  // 최근 강의 청크 가져오기 (resolvedSubjectId가 있으면 과목 필터 적용)
  let recentLectures
  if (resolvedAcademyId && resolvedSubjectId) {
    const result = await pool.query(
      `SELECT id FROM lectures
       WHERE academy_id = $1 AND subject_id = $2 AND processing_status = 'done' AND deleted_at IS NULL
       ORDER BY created_at DESC LIMIT 3`,
      [resolvedAcademyId, resolvedSubjectId]
    )
    recentLectures = result.rows
  } else if (resolvedAcademyId) {
    const result = await pool.query(
      `SELECT id FROM lectures
       WHERE academy_id = $1 AND processing_status = 'done' AND deleted_at IS NULL
       ORDER BY created_at DESC LIMIT 3`,
      [resolvedAcademyId]
    )
    recentLectures = result.rows
  } else {
    recentLectures = []
  }

  let availableChunks = []
  for (const lecture of recentLectures) {
    const chunks = await getChunksByLectureId(lecture.id)
    availableChunks.push(...chunks.map((c) => c.content))
  }

  let questions
  try {
    questions = await generateExam({
      weakTypes,
      allTypes,
      area: area || '국어',
      availableChunks,
    })
  } catch (aiErr) {
    // OpenAI API 에러(401, 429 등)를 503으로 변환해 프론트 로그아웃 방지
    const err = new Error(aiErr.message || 'AI 모의고사 생성에 실패했습니다')
    err.status = 503
    throw err
  }

  if (!resolvedSubjectId) {
    const err = new Error('과목 정보를 찾을 수 없습니다. 학원에 등록된 강의가 있는지 확인해주세요.')
    err.status = 400
    throw err
  }

  const exam = await examRepository.createExam({
    student_id: studentId,
    academy_id: resolvedAcademyId,
    subject_id: resolvedSubjectId,
    questions,
  })
  return examRepository.findExamById(exam.id)
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
