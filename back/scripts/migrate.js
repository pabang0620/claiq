import pg from 'pg'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'

dotenv.config()

const { Client } = pg
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const MIGRATIONS_DIR = path.join(__dirname, '../migrations')

async function migrate() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  })

  try {
    await client.connect()
    console.log('✅ PostgreSQL 연결 성공')

    // claiq 스키마 생성
    await client.query(`CREATE SCHEMA IF NOT EXISTS claiq`)
    console.log('✅ claiq 스키마 생성 (또는 이미 존재)')

    // search_path 설정
    await client.query('SET search_path TO claiq, public')

    // 마이그레이션 파일 순서대로 실행
    const files = fs.readdirSync(MIGRATIONS_DIR)
      .filter(f => f.endsWith('.sql'))
      .sort()

    for (const file of files) {
      const filePath = path.join(MIGRATIONS_DIR, file)
      const sql = fs.readFileSync(filePath, 'utf8')
      console.log(`  실행 중: ${file}`)
      await client.query(sql)
      console.log(`  ✅ ${file} 완료`)
    }

    console.log('\n🎉 마이그레이션 완료!')
  } catch (err) {
    console.error('❌ 마이그레이션 실패:', err.message)
    console.error(err)
    process.exit(1)
  } finally {
    await client.end()
  }
}

migrate()
