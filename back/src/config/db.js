import pg from 'pg'
import { env } from './env.js'
import { logger } from '../utils/logger.js'

const { Pool } = pg

export const pool = new Pool({
  connectionString: env.db.url,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  ssl: env.nodeEnv === 'production' ? { rejectUnauthorized: false } : false,
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
