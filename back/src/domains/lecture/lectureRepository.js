import { pool } from '../../config/db.js'

export const createLecture = async ({ academy_id, teacher_id, subject_id, title, description, audio_url, scheduled_at }) => {
  const { rows } = await pool.query(
    `INSERT INTO lectures (academy_id, teacher_id, subject_id, title, description, audio_url, scheduled_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [academy_id, teacher_id, subject_id, title, description || null, audio_url || null, scheduled_at || null]
  )
  return rows[0]
}

export const updateLectureStatus = async (id, status, extras = {}) => {
  const sets = ['processing_status = $2', 'updated_at = NOW()']
  const params = [id, status]
  let idx = 3

  if (extras.transcript !== undefined) {
    sets.push(`transcript = $${idx++}`)
    params.push(extras.transcript)
  }
  if (extras.type_tags !== undefined) {
    sets.push(`type_tags = $${idx++}`)
    params.push(extras.type_tags)
  }
  if (extras.processing_error !== undefined) {
    sets.push(`processing_error = $${idx++}`)
    params.push(extras.processing_error)
  }
  if (extras.audio_url !== undefined) {
    sets.push(`audio_url = $${idx++}`)
    params.push(extras.audio_url)
  }

  const { rows } = await pool.query(
    `UPDATE lectures SET ${sets.join(', ')} WHERE id = $1 RETURNING *`,
    params
  )
  return rows[0]
}

export const findLectureById = async (id) => {
  const { rows } = await pool.query(
    `SELECT l.*, s.name AS subject_name, s.area AS subject_area,
            u.name AS teacher_name
     FROM lectures l
     JOIN subjects s ON s.id = l.subject_id
     JOIN users u ON u.id = l.teacher_id
     WHERE l.id = $1 AND l.deleted_at IS NULL`,
    [id]
  )
  return rows[0] || null
}

export const findLectures = async ({ academy_id, teacher_id, subject_id, limit = 20, offset = 0 }) => {
  const conditions = ['l.deleted_at IS NULL']
  const params = []
  let idx = 1

  if (academy_id) { conditions.push(`l.academy_id = $${idx++}`); params.push(academy_id) }
  if (teacher_id) { conditions.push(`l.teacher_id = $${idx++}`); params.push(teacher_id) }
  if (subject_id) { conditions.push(`l.subject_id = $${idx++}`); params.push(subject_id) }

  params.push(limit, offset)

  const [dataResult, countResult] = await Promise.all([
    pool.query(
      `SELECT l.id, l.title, l.description, l.processing_status, l.type_tags,
              l.scheduled_at, l.taught_at, l.created_at,
              s.name AS subject_name, s.area AS subject_area,
              u.name AS teacher_name
       FROM lectures l
       JOIN subjects s ON s.id = l.subject_id
       JOIN users u ON u.id = l.teacher_id
       WHERE ${conditions.join(' AND ')}
       ORDER BY l.created_at DESC
       LIMIT $${idx++} OFFSET $${idx++}`,
      params
    ),
    pool.query(
      `SELECT COUNT(*) FROM lectures l WHERE ${conditions.join(' AND ')}`,
      params.slice(0, params.length - 2)
    ),
  ])

  return { lectures: dataResult.rows, total: parseInt(countResult.rows[0].count) }
}
