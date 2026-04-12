import pg from 'pg'
import { env } from './env.js'
import { logger } from '../utils/logger.js'

const { Pool } = pg

export const pool = new Pool({
  connectionString: env.db.url,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  ssl: { rejectUnauthorized: false },
  // claiq 스키마 search_path 고정 — Transaction Mode pooler에서도 적용
  options: "-c search_path=claiq,public -c timezone=Asia/Seoul",
})

// Transaction Mode pooler(6543)에서는 options 파라미터가 무시되므로
// 각 새 연결마다 명시적으로 search_path를 설정한다
pool.on('connect', (client) => {
  client.query("SET search_path TO claiq, public").catch((err) => {
    logger.error('search_path 설정 실패:', err.message)
  })
})

pool.on('error', (err) => {
  logger.error('DB 연결 오류:', err.message)
})

// Transaction Mode(port 6543): pool.query를 override해 매 호출마다
// search_path를 명시적으로 설정한다. session 변수가 트랜잭션 간 유지되지
// 않는 Transaction Mode pooler에서 유일하게 신뢰할 수 있는 방식이다.
const _poolQuery = pool.query.bind(pool)
pool.query = async (text, values) => {
  const client = await pool.connect()
  try {
    await client.query("SET search_path TO claiq, public")
    return await client.query(text, values)
  } finally {
    client.release()
  }
}

export const connectDB = async () => {
  try {
    const client = await pool.connect()
    await client.query('SELECT 1')
    client.release()
    logger.info('PostgreSQL 연결 성공')
  } catch (err) {
    logger.error('PostgreSQL 연결 실패:', err.message)
    if (env.nodeEnv === 'production') {
      process.exit(1)
    }
  }
}

export const query = (text, params) => pool.query(text, params)

export const withTransaction = async (callback) => {
  const client = await pool.connect()
  try {
    await client.query("SET search_path TO claiq, public")
    await client.query('BEGIN')
    const result = await callback(client)
    await client.query('COMMIT')
    return result
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}
