import { pool } from '../../config/db.js'

export const saveChunks = async (chunks) => {
  if (!chunks.length) return []

  const saved = []
  for (const chunk of chunks) {
    const embeddingStr = chunk.embedding
      ? `'[${chunk.embedding.join(',')}]'::vector`
      : 'NULL'

    const { rows } = await pool.query(
      `INSERT INTO lecture_chunks (lecture_id, teacher_id, academy_id, chunk_index, content, token_count, embedding)
       VALUES ($1, $2, $3, $4, $5, $6, ${embeddingStr})
       RETURNING id`,
      [chunk.lecture_id, chunk.teacher_id, chunk.academy_id, chunk.chunk_index, chunk.content, chunk.token_count || null]
    )
    saved.push(rows[0])
  }
  return saved
}

export const searchSimilarChunks = async ({ embedding, teacherId, academyId, topK = 5 }) => {
  const embeddingStr = `'[${embedding.join(',')}]'::vector`

  const { rows } = await pool.query(
    `SELECT lc.id, lc.lecture_id, lc.content,
            1 - (lc.embedding <=> ${embeddingStr}) AS similarity
     FROM lecture_chunks lc
     WHERE lc.teacher_id = $1
       AND lc.academy_id = $2
       AND lc.embedding IS NOT NULL
     ORDER BY lc.embedding <=> ${embeddingStr}
     LIMIT $3`,
    [teacherId, academyId, topK]
  )
  return rows
}

export const deleteChunksByLectureId = async (lectureId) => {
  await pool.query(
    `DELETE FROM lecture_chunks WHERE lecture_id = $1`,
    [lectureId]
  )
}

export const getChunksByLectureId = async (lectureId) => {
  const { rows } = await pool.query(
    `SELECT id, chunk_index, content, token_count
     FROM lecture_chunks WHERE lecture_id = $1
     ORDER BY chunk_index ASC`,
    [lectureId]
  )
  return rows
}
