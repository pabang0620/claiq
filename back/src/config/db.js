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
})

// claiq 스키마를 기본 search_path로 설정 (public 포함: uuid_generate_v4, vector 타입 접근)
pool.on('connect', (client) => {
  client.query("SET search_path TO claiq, public; SET timezone TO 'Asia/Seoul'")
})

pool.on('error', (err) => {
  logger.error('DB 연결 오류:', err.message)
})

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
