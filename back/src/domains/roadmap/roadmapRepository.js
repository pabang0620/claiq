import { pool, withTransaction } from '../../config/db.js'

export const findCurrentRoadmap = async (student_id) => {
  const { rows } = await pool.query(
    `SELECT lr.*, array_agg(row_to_json(ri.*) ORDER BY ri.week_number, ri.priority_rank) AS items
     FROM learning_roadmaps lr
     LEFT JOIN roadmap_items ri ON ri.roadmap_id = lr.id
     WHERE lr.student_id = $1 AND lr.is_current = true
     GROUP BY lr.id`,
    [student_id]
  )
  return rows[0] || null
}

export const createRoadmap = async ({ student_id, academy_id, dday_count, suneung_date, summary, items, expires_at }) => {
  return withTransaction(async (client) => {
    // 기존 current 로드맵 비활성화
    await client.query(
      `UPDATE learning_roadmaps SET is_current = false WHERE student_id = $1 AND is_current = true`,
      [student_id]
    )

    // 새 로드맵 생성
    const { rows } = await client.query(
      `INSERT INTO learning_roadmaps (student_id, academy_id, dday_count, suneung_date, summary, is_current, expires_at)
       VALUES ($1, $2, $3, $4, $5, true, $6)
       RETURNING *`,
      [student_id, academy_id, dday_count, suneung_date, summary, expires_at || null]
    )
    const roadmap = rows[0]

    // 항목 삽입
    for (const item of items) {
      await client.query(
        `INSERT INTO roadmap_items (roadmap_id, week_number, type_code, type_name, priority_rank, note)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [roadmap.id, item.week_number, item.type_code, item.type_name, item.priority_rank, item.note || null]
      )
    }

    return roadmap
  })
}

export const updateItemStatus = async (itemId, status, userId) => {
  const { rows } = await pool.query(
    `UPDATE roadmap_items ri
     SET status = $2, updated_at = NOW()
     FROM learning_roadmaps lr
     WHERE ri.id = $1
       AND ri.roadmap_id = lr.id
       AND lr.student_id = $3
     RETURNING ri.*`,
    [itemId, status, userId]
  )
  return rows[0] || null
}

export const findAllCurrentRoadmaps = async (academy_id) => {
  const { rows } = await pool.query(
    `SELECT lr.student_id
     FROM learning_roadmaps lr
     JOIN academy_members am ON am.user_id = lr.student_id
     WHERE am.academy_id = $1 AND am.status = 'active' AND lr.is_current = true`,
    [academy_id]
  )
  return rows
}
