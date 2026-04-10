import { pool } from '../../config/db.js'

/**
 * 부동소수점 숫자 배열을 pgvector 리터럴 문자열로 변환한다.
 * 각 요소가 유한한 숫자인지 검증해 SQL injection을 방지한다.
 */
const toVectorLiteral = (embedding) => {
  const validated = embedding.map((v) => {
    const n = Number(v)
    if (!isFinite(n)) throw new Error('임베딩 벡터에 유효하지 않은 값이 포함되어 있습니다')
    return n
  })
  return `'[${validated.join(',')}]'::vector`
}

export const saveChunks = async (chunks) => {
  if (!chunks.length) return []

  const saved = []
  for (const chunk of chunks) {
    const embeddingStr = chunk.embedding ? toVectorLiteral(chunk.embedding) : 'NULL'

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
  const embeddingStr = toVectorLiteral(embedding)

  // pgvector: <=> 연산자는 코사인 거리(cosine distance)를 계산
  // cosine_similarity = 1 - cosine_distance
  // ORDER BY <=> ASC: 코사인 거리가 작을수록(= 유사도가 높을수록) 먼저 정렬됨
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
