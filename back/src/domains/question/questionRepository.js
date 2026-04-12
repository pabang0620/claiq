import { pool, withTransaction } from '../../config/db.js'

export const createQuestion = async ({ lecture_id, academy_id, teacher_id, subject_id, type_code, content, answer_type, correct_answer, explanation, difficulty, options }) => {
  return withTransaction(async (client) => {
    const { rows } = await client.query(
      `INSERT INTO questions (lecture_id, academy_id, teacher_id, subject_id, type_code, content, answer_type, correct_answer, explanation, difficulty)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [lecture_id, academy_id, teacher_id, subject_id, type_code || null, content, answer_type, correct_answer, explanation || null, difficulty]
    )
    const question = rows[0]

    if (answer_type === 'multiple_choice' && Array.isArray(options)) {
      for (const opt of options) {
        await client.query(
          `INSERT INTO question_options (question_id, label, content) VALUES ($1, $2, $3)`,
          [question.id, opt.label, opt.content]
        )
      }
    }
    return question
  })
}

export const findPendingQuestions = async ({ academy_id, teacher_id, limit = 20, offset = 0, status = 'pending' }) => {
  const params = [status]
  let idx = 2
  const conditions = [`q.status = $1`, 'q.deleted_at IS NULL']

  if (academy_id) { conditions.push(`q.academy_id = $${idx++}`); params.push(academy_id) }
  if (teacher_id) { conditions.push(`q.teacher_id = $${idx++}`); params.push(teacher_id) }

  const countParams = [...params]
  params.push(limit, offset)

  const [{ rows }, { rows: countRows }] = await Promise.all([
    pool.query(
      `SELECT q.*, l.title AS lecture_title, s.name AS subject_name,
              array_agg(row_to_json(qo.*)) FILTER (WHERE qo.id IS NOT NULL) AS options
       FROM questions q
       JOIN lectures l ON l.id = q.lecture_id
       JOIN subjects s ON s.id = q.subject_id
       LEFT JOIN question_options qo ON qo.question_id = q.id
       WHERE ${conditions.join(' AND ')}
       GROUP BY q.id, l.title, s.name
       ORDER BY q.created_at ASC
       LIMIT $${idx} OFFSET $${idx + 1}`,
      params
    ),
    pool.query(
      `SELECT COUNT(*) FROM questions q WHERE ${conditions.join(' AND ')}`,
      countParams
    ),
  ])

  return { rows, total: parseInt(countRows[0].count, 10) }
}

export const findQuestionById = async (id) => {
  const [qResult, optResult] = await Promise.all([
    pool.query(`SELECT q.*, l.title AS lecture_title FROM questions q JOIN lectures l ON l.id = q.lecture_id WHERE q.id = $1 AND q.deleted_at IS NULL`, [id]),
    pool.query(`SELECT * FROM question_options WHERE question_id = $1 ORDER BY label`, [id]),
  ])
  if (!qResult.rows[0]) return null
  return { ...qResult.rows[0], options: optResult.rows }
}

export const reviewQuestion = async ({ id, status, content, correct_answer, explanation, reviewedBy }) => {
  const sets = ['status = $2', 'reviewed_at = NOW()', 'reviewed_by = $3', 'updated_at = NOW()']
  const params = [id, status, reviewedBy]
  let idx = 4

  if (content !== undefined) { sets.push(`content = $${idx++}`); params.push(content) }
  if (correct_answer !== undefined) { sets.push(`correct_answer = $${idx++}`); params.push(correct_answer) }
  if (explanation !== undefined) { sets.push(`explanation = $${idx++}`); params.push(explanation) }

  const { rows } = await pool.query(
    `UPDATE questions SET ${sets.join(', ')} WHERE id = $1 RETURNING *`,
    params
  )
  return rows[0]
}

export const findApprovedQuestions = async ({ academy_id, type_code, difficulty, limit = 20, offset = 0 }) => {
  const conditions = [`q.status = 'approved'`, 'q.deleted_at IS NULL']
  const params = []
  let idx = 1

  if (academy_id) { conditions.push(`q.academy_id = $${idx++}`); params.push(academy_id) }
  if (type_code) { conditions.push(`q.type_code = $${idx++}`); params.push(type_code) }
  if (difficulty) { conditions.push(`q.difficulty = $${idx++}`); params.push(difficulty) }

  params.push(limit, offset)

  const { rows } = await pool.query(
    `SELECT q.id, q.content, q.answer_type, q.difficulty, q.type_code, q.created_at,
            s.name AS subject_name
     FROM questions q
     JOIN subjects s ON s.id = q.subject_id
     WHERE ${conditions.join(' AND ')}
     ORDER BY q.created_at DESC
     LIMIT $${idx++} OFFSET $${idx++}`,
    params
  )
  return rows
}

export const submitAnswer = async ({ student_id, question_id, academy_id, submitted, is_correct, points_earned }) => {
  const { rows } = await pool.query(
    `INSERT INTO answer_submissions (student_id, question_id, academy_id, submitted, is_correct, points_earned)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [student_id, question_id, academy_id, submitted, is_correct, points_earned]
  )
  return rows[0]
}

export const upsertTypeStats = async ({ student_id, academy_id, type_code, subject_id, is_correct }) => {
  await pool.query(
    `INSERT INTO student_type_stats (student_id, academy_id, type_code, subject_id, total_attempts, correct_count, correct_rate, last_attempted_at)
     VALUES ($1, $2, $3, $4, 1, $5::integer, $5::decimal, NOW())
     ON CONFLICT (student_id, type_code) DO UPDATE SET
       total_attempts = student_type_stats.total_attempts + 1,
       correct_count = student_type_stats.correct_count + $5::integer,
       correct_rate = (student_type_stats.correct_count + $5::integer)::decimal / (student_type_stats.total_attempts + 1),
       last_attempted_at = NOW(),
       updated_at = NOW()`,
    [student_id, academy_id, type_code, subject_id, is_correct ? 1 : 0]
  )
}

export const findTypeStats = async (student_id, academy_id = null, subject = null) => {
  const conditions = ['sts.student_id = $1']
  const params = [student_id]
  let idx = 2

  if (academy_id) {
    conditions.push(`sts.academy_id = $${idx++}`)
    params.push(academy_id)
  }
  if (subject) {
    conditions.push(`s.code = $${idx++}`)
    params.push(subject)
  }

  const { rows } = await pool.query(
    `SELECT sts.*, s.name AS subject_name, s.area AS subject_area, s.code AS subject_code
     FROM student_type_stats sts
     JOIN subjects s ON s.id = sts.subject_id
     WHERE ${conditions.join(' AND ')}
     ORDER BY sts.correct_rate ASC`,
    params
  )
  return rows
}
