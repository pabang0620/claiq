import pg from 'pg'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'

dotenv.config()

const { Client } = pg
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const SEEDS_DIR = path.join(__dirname, '../seeds')

async function seed() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  })

  try {
    await client.connect()
    console.log('✅ PostgreSQL 연결 성공')

    await client.query('SET search_path TO claiq, public')

    const files = fs.readdirSync(SEEDS_DIR)
      .filter(f => f.endsWith('.sql'))
      .sort()

    for (const file of files) {
      const filePath = path.join(SEEDS_DIR, file)
      const sql = fs.readFileSync(filePath, 'utf8')
      console.log(`  실행 중: ${file}`)
      await client.query(sql)
      console.log(`  ✅ ${file} 완료`)
    }

    console.log('\n🎉 시드 데이터 투입 완료!')
    console.log('\n📋 데모 계정:')
    console.log('  운영자: admin@claiq.kr    / claiq1234')
    console.log('  교강사: teacher@claiq.kr  / claiq1234')
    console.log('  수강생: student@claiq.kr  / claiq1234')
  } catch (err) {
    console.error('❌ 시드 실패:', err.message)
    console.error(err)
    process.exit(1)
  } finally {
    await client.end()
  }
}

seed()
