import path from 'path'
import * as lectureRepository from './lectureRepository.js'
import * as vectorRepository from './vectorRepository.js'
import * as questionRepository from '../question/questionRepository.js'
import * as academyRepository from '../academy/academyRepository.js'
import { uploadToStorage } from '../../config/supabase.js'
import { transcribeAudio } from '../../ai/whisper.js'
import { embedTexts } from '../../ai/embedding.js'
import { mapTypes } from '../../ai/typeMapper.js'
import { generateAllQuestions } from '../../ai/questionGenerator.js'
import { chunkText } from '../../utils/textChunker.js'
import { env } from '../../config/env.js'
import { logger } from '../../utils/logger.js'

/**
 * 업로드 파일명에서 경로 트래버설 및 특수문자를 제거해 안전한 파일명을 반환한다.
 * - ../ 경로 이동 차단
 * - 영문·숫자·한글·밑줄·하이픈·점만 허용
 */
const sanitizeFilename = (filename) => {
  const base = path.basename(filename) // ../ 같은 경로 구분자 제거
  return base.replace(/[^a-zA-Z0-9가-힣._-]/g, '_').slice(0, 200)
}

// SSE 클라이언트 관리
const sseClients = new Map()

export const addSseClient = (lectureId, res) => {
  if (!sseClients.has(lectureId)) sseClients.set(lectureId, new Set())
  sseClients.get(lectureId).add(res)

  // 클라이언트 disconnect 시 자동 제거
  res.on('close', () => {
    removeSseClient(lectureId, res)
  })
}

export const removeSseClient = (lectureId, res) => {
  sseClients.get(lectureId)?.delete(res)
}

export const broadcastStatus = (lectureId, type, extra = {}) => {
  const clients = sseClients.get(lectureId)
  if (!clients) return
  const data = JSON.stringify({ type, ...extra })
  for (const res of clients) {
    res.write(`data: ${data}\n\n`)
  }
}

export const uploadLecture = async ({ file, materialFiles, body, user }) => {
  const { title, description, scheduled_at } = body

  // academy_id를 body 대신 DB에서 조회 (교강사 소속 학원)
  const academies = await academyRepository.findUserAcademies(user.id)
  if (!academies.length) {
    const err = new Error('소속된 학원이 없습니다')
    err.status = 404
    throw err
  }
  const academy_id = academies[0].id

  // 프론트에서 /api/subjects로 조회한 UUID를 subject_id 또는 subject 필드로 전송
  const subject_id = body.subject_id || body.subject
  if (!subject_id) {
    const err = new Error('과목을 선택해주세요')
    err.status = 400
    throw err
  }

  // 1. 오디오 Supabase 업로드
  let audio_url = null
  if (file) {
    const safeFilename = sanitizeFilename(file.originalname)
    const storagePath = `lectures/${user.id}/${Date.now()}_${safeFilename}`
    audio_url = await uploadToStorage(env.supabase.bucketAudio, storagePath, file.buffer, file.mimetype)
  }

  // 2. lectures 레코드 생성
  const lecture = await lectureRepository.createLecture({
    academy_id,
    teacher_id: user.id,
    subject_id,
    title,
    description,
    audio_url,
    scheduled_at,
  })

  // 3. 백그라운드 처리 (비동기 - 응답을 기다리지 않음)
  processLecture(lecture, file).catch(async (err) => {
    logger.error(`강의 처리 실패 [${lecture.id}]:`, err.message)
    try {
      await lectureRepository.updateLectureStatus(lecture.id, 'error', {
        processing_error: err.message,
      })
      broadcastStatus(lecture.id, 'error', { message: err.message })
    } catch (updateErr) {
      logger.error('상태 업데이트 실패:', updateErr.message)
    }
  })

  return lecture
}

const processLecture = async (lecture, file) => {
  try {
    // STT
    await lectureRepository.updateLectureStatus(lecture.id, 'stt_processing')
    broadcastStatus(lecture.id, 'progress', { step: 'stt', progress: 10 })

    let transcript = ''
    if (file) {
      transcript = await transcribeAudio(file.buffer, file.mimetype, file.originalname)
    }
    await lectureRepository.updateLectureStatus(lecture.id, 'embedding', { transcript })
    broadcastStatus(lecture.id, 'progress', { step: 'embedding', progress: 35 })

    // 청킹 + 임베딩
    const chunks = chunkText(transcript)
    const texts = chunks.map((c) => c.content)
    const embeddings = await embedTexts(texts)

    const chunkDocs = chunks.map((c, i) => ({
      lecture_id: lecture.id,
      teacher_id: lecture.teacher_id,
      academy_id: lecture.academy_id,
      chunk_index: c.chunk_index,
      content: c.content,
      token_count: c.token_count,
      embedding: embeddings[i],
    }))
    await vectorRepository.saveChunks(chunkDocs)

    // 유형 매핑
    await lectureRepository.updateLectureStatus(lecture.id, 'type_mapping')
    broadcastStatus(lecture.id, 'progress', { step: 'type_mapping', progress: 60 })

    // 강의 과목으로 area 조회
    const fullLecture = await lectureRepository.findLectureById(lecture.id)
    const area = fullLecture?.subject_area || '국어'
    const typeCodes = await mapTypes(transcript, area)

    await lectureRepository.updateLectureStatus(lecture.id, 'question_gen', { type_tags: typeCodes })
    broadcastStatus(lecture.id, 'progress', { step: 'question_gen', progress: 75 })

    // 문제 생성
    const chunkContents = chunks.map((c) => c.content)
    const questions = await generateAllQuestions(chunkContents, area, typeCodes)

    // 문제 저장
    for (const q of questions) {
      await questionRepository.createQuestion({
        lecture_id: lecture.id,
        academy_id: lecture.academy_id,
        teacher_id: lecture.teacher_id,
        subject_id: lecture.subject_id,
        type_code: q.type_code,
        content: q.content,
        answer_type: q.answer_type || 'multiple_choice',
        correct_answer: q.correct_answer,
        explanation: q.explanation,
        difficulty: q.difficulty,
        options: q.options,
      })
    }

    await lectureRepository.updateLectureStatus(lecture.id, 'done')
    broadcastStatus(lecture.id, 'done', { questionCount: questions.length })
    logger.info(`강의 처리 완료 [${lecture.id}]: 문제 ${questions.length}개 생성`)
  } catch (err) {
    await lectureRepository.updateLectureStatus(lecture.id, 'error', {
      processing_error: err.message,
    })
    broadcastStatus(lecture.id, 'error', { message: err.message })
    logger.error(`강의 처리 에러 [${lecture.id}]:`, err.message)
  }
}

export const getLecture = async (id) => {
  const lecture = await lectureRepository.findLectureById(id)
  if (!lecture) {
    const err = new Error('강의를 찾을 수 없습니다')
    err.status = 404
    throw err
  }
  return lecture
}

export const deleteLecture = async ({ lectureId, teacherId }) => {
  const lecture = await lectureRepository.findLectureById(lectureId)
  if (!lecture) {
    const err = new Error('강의를 찾을 수 없습니다')
    err.status = 404
    throw err
  }
  if (lecture.teacher_id !== teacherId) {
    const err = new Error('본인 강의만 삭제할 수 있습니다')
    err.status = 403
    throw err
  }
  await lectureRepository.deleteLecture(lectureId)
}

export const getMaterials = async (lectureId) => {
  return lectureRepository.findMaterials(lectureId)
}

export const uploadMaterial = async ({ lectureId, teacherId, file, title }) => {
  const lecture = await lectureRepository.findLectureById(lectureId)
  if (!lecture) {
    const err = new Error('강의를 찾을 수 없습니다')
    err.status = 404
    throw err
  }
  if (lecture.teacher_id !== teacherId) {
    const err = new Error('본인 강의에만 자료를 업로드할 수 있습니다')
    err.status = 403
    throw err
  }

  let file_url = null
  if (file) {
    const safeFilename = sanitizeFilename(file.originalname)
    const storagePath = `materials/${teacherId}/${Date.now()}_${safeFilename}`
    file_url = await uploadToStorage(env.supabase.bucketMaterial, storagePath, file.buffer, file.mimetype)
  }

  return lectureRepository.createMaterial({
    lecture_id: lectureId,
    teacher_id: teacherId,
    title: title || (file ? sanitizeFilename(file.originalname) : '자료'),
    file_url,
    file_type: file?.mimetype || null,
  })
}

export const deleteMaterial = async ({ lectureId, materialId, teacherId }) => {
  await lectureRepository.deleteMaterial(materialId, lectureId, teacherId)
}

export const getMyMaterials = async (studentId) => {
  return lectureRepository.findMaterialsByStudent(studentId)
}

export const getLectures = async ({ academy_id, teacher_id, subject_id, page = 1, limit = 20 }) => {
  const offset = (page - 1) * limit
  const { lectures, total } = await lectureRepository.findLectures({
    academy_id,
    teacher_id,
    subject_id,
    limit,
    offset,
  })
  return {
    data: lectures,
    meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
  }
}
