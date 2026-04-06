import { pool, withTransaction } from '../../config/db.js'

export const createExam = async ({ student_id, academy_id, subject_id, questions }) => {
  return withTransaction(async (client) => {
    const { rows } = await client.query(
      `INSERT INTO mini_exams (student_id, academy_id, subject_id, total_questions)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [student_id, academy_id, subject_id, questions.length]
    )
    const exam = rows[0]

    for (const q of questions) {
      await client.query(
        `INSERT INTO mini_exam_questions
         (exam_id, question_order, content, answer_type, options, correct_answer, type_code, type_name, difficulty, score, explanation)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [
          exam.id,
          q.question_order,
          q.content,
          q.answer_type || 'multiple_choice',
          q.options ? JSON.stringify(q.options) : null,
          q.correct_answer,
          q.type_code,
          q.type_name,
          q.difficulty,
          q.score || 5,
          q.explanation || null,
        ]
      )
    }

    return exam
  })
}

export const findExamById = async (id) => {
  const [examResult, qResult] = await Promise.all([
    pool.query(`SELECT * FROM mini_exams WHERE id = $1`, [id]),
    pool.query(
      `SELECT meq.*, mes.submitted, mes.is_correct, mes.score_earned
       FROM mini_exam_questions meq
       LEFT JOIN mini_exam_submissions mes ON mes.question_id = meq.id
       WHERE meq.exam_id = $1
       ORDER BY meq.question_order`,
      [id]
    ),
  ])
  if (!examResult.rows[0]) return null
  return { ...examResult.rows[0], questions: qResult.rows }
}

export const submitExam = async ({ exam_id, student_id, answers }) => {
  return withTransaction(async (client) => {
    // 문항 조회
    const { rows: questions } = await client.query(
      `SELECT * FROM mini_exam_questions WHERE exam_id = $1 ORDER BY question_order`,
      [exam_id]
    )

    let totalScore = 0
    const submissions = []

    for (const q of questions) {
      const answer = answers.find((a) => a.question_id === q.id)
      const submitted = answer?.submitted || ''
      const is_correct = submitted.trim() === q.correct_answer.trim()
      const score_earned = is_correct ? q.score : 0
      totalScore += score_earned

      await client.query(
        `INSERT INTO mini_exam_submissions (exam_id, question_id, student_id, submitted, is_correct, score_earned, type_code)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (exam_id, question_id) DO NOTHING`,
        [exam_id, q.id, student_id, submitted, is_correct, score_earned, q.type_code]
      )
      submissions.push({ question_id: q.id, is_correct, score_earned })
    }

    const { rows } = await client.query(
      `UPDATE mini_exams
       SET status = 'graded', submitted_at = NOW(), score = $2
       WHERE id = $1
       RETURNING *`,
      [exam_id, totalScore]
    )

    return { exam: rows[0], submissions, totalScore }
  })
}

export const findExamReport = async (exam_id) => {
  const [examResult, subResult] = await Promise.all([
    pool.query(
      `SELECT me.*, s.name AS subject_name, u.name AS student_name
       FROM mini_exams me
       JOIN subjects s ON s.id = me.subject_id
       JOIN users u ON u.id = me.student_id
       WHERE me.id = $1`,
      [exam_id]
    ),
    pool.query(
      `SELECT meq.type_code, meq.type_name, meq.difficulty,
              mes.is_correct, mes.score_earned, mes.submitted, meq.correct_answer, meq.explanation
       FROM mini_exam_questions meq
       LEFT JOIN mini_exam_submissions mes ON mes.question_id = meq.id
       WHERE meq.exam_id = $1
       ORDER BY meq.question_order`,
      [exam_id]
    ),
  ])

  if (!examResult.rows[0]) return null

  const typeAnalysis = {}
  for (const row of subResult.rows) {
    if (!typeAnalysis[row.type_code]) {
      typeAnalysis[row.type_code] = { type_name: row.type_name, total: 0, correct: 0 }
    }
    typeAnalysis[row.type_code].total++
    if (row.is_correct) typeAnalysis[row.type_code].correct++
  }

  return {
    exam: examResult.rows[0],
    questions: subResult.rows,
    typeAnalysis,
  }
}
