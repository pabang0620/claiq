import { pool } from '../../config/db.js'

export const createSession = async ({ student_id, teacher_id, academy_id, lecture_id, title }) => {
  const { rows } = await pool.query(
    `INSERT INTO qa_sessions (student_id, teacher_id, academy_id, lecture_id, title)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [student_id, teacher_id, academy_id, lecture_id || null, title || null]
  )
  return rows[0]
}

export const findSessionById = async (id) => {
  const { rows } = await pool.query(
    `SELECT qs.*, u.name AS student_name, t.name AS teacher_name
     FROM qa_sessions qs
     JOIN users u ON u.id = qs.student_id
     JOIN users t ON t.id = qs.teacher_id
     WHERE qs.id = $1`,
    [id]
  )
  return rows[0] || null
}

export const findSessionsByStudent = async (student_id, limit = 20, offset = 0) => {
  const { rows } = await pool.query(
    `SELECT qs.*,
            (SELECT content FROM qa_messages WHERE session_id = qs.id ORDER BY created_at DESC LIMIT 1) AS last_message
     FROM qa_sessions qs
     WHERE qs.student_id = $1
     ORDER BY qs.updated_at DESC
     LIMIT $2 OFFSET $3`,
    [student_id, limit, offset]
  )
  return rows
}

export const saveMessage = async ({ session_id, role, content, is_escalated, source_chunks }) => {
  const { rows } = await pool.query(
    `INSERT INTO qa_messages (session_id, role, content, is_escalated, source_chunks)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [session_id, role, content, is_escalated || false, source_chunks || null]
  )
  await pool.query(
    `UPDATE qa_sessions SET updated_at = NOW() WHERE id = $1`,
    [session_id]
  )
  return rows[0]
}

export const findMessages = async (session_id) => {
  const { rows } = await pool.query(
    `SELECT * FROM qa_messages WHERE session_id = $1 ORDER BY created_at ASC`,
    [session_id]
  )
  return rows
}

export const findEscalations = async ({ teacher_id, academy_id, answered = false, limit = 20, offset = 0 }) => {
  const answerFilter = answered
    ? 'AND qm.escalation_response IS NOT NULL'
    : 'AND qm.escalation_response IS NULL'

  const conditions = ['qm.is_escalated = true', 'qs.teacher_id = $1']
  const params = [teacher_id]
  let idx = 2

  if (academy_id) {
    conditions.push(`qs.academy_id = $${idx++}`)
    params.push(academy_id)
  }

  params.push(limit, offset)

  const { rows } = await pool.query(
    `SELECT qm.*, qs.student_id, u.name AS student_name, qs.title AS session_title,
            (SELECT content FROM qa_messages
             WHERE session_id = qm.session_id AND role = 'user' AND created_at < qm.created_at
             ORDER BY created_at DESC LIMIT 1) AS student_question
     FROM qa_messages qm
     JOIN qa_sessions qs ON qs.id = qm.session_id
     JOIN users u ON u.id = qs.student_id
     WHERE ${conditions.join(' AND ')}
       ${answerFilter}
     ORDER BY qm.created_at DESC
     LIMIT $${idx} OFFSET $${idx + 1}`,
    params
  )
  return rows
}

export const replyEscalation = async (messageId, response) => {
  const { rows } = await pool.query(
    `UPDATE qa_messages
     SET escalation_response = $2, escalated_at = NOW()
     WHERE id = $1
     RETURNING *`,
    [messageId, response]
  )
  return rows[0]
}
