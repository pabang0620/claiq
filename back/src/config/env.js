import dotenv from 'dotenv'
dotenv.config()

const isProd = process.env.NODE_ENV === 'production'

/**
 * 환경변수를 읽는다.
 * - production: 값이 없으면 서버 시작을 즉시 중단 (throw)
 * - 그 외: defaultValue 반환
 */
function required(key, defaultValue = '') {
  const val = process.env[key]
  if (!val) {
    if (isProd) throw new Error(`필수 환경변수 누락: ${key}`)
    return defaultValue
  }
  return val
}

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '5000'),

  db: {
    url: required('DATABASE_URL', 'postgresql://postgres:password@localhost:5432/claiq_db'),
  },

  supabase: {
    url: required('SUPABASE_URL', 'https://placeholder.supabase.co'),
    serviceRoleKey: required('SUPABASE_SERVICE_ROLE_KEY', 'placeholder'),
    bucketAudio: process.env.SUPABASE_STORAGE_BUCKET_AUDIO || 'claiq-audio',
    bucketMaterial: process.env.SUPABASE_STORAGE_BUCKET_MATERIAL || process.env.SUPABASE_STORAGE_BUCKET_AUDIO || 'claiq-audio',
  },

  jwt: {
    secret: required('JWT_SECRET', 'dev_jwt_secret_claiq_2026'),
    expiresIn: process.env.JWT_EXPIRES_IN || '1h',
    refreshSecret: required('REFRESH_TOKEN_SECRET', 'dev_refresh_secret_claiq_2026'),
    refreshExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '30d',
  },

  openai: {
    apiKey: required('OPENAI_API_KEY', 'sk-placeholder'),
    modelChat: process.env.OPENAI_MODEL_CHAT || 'gpt-4o-mini',
    modelEmbedding: process.env.OPENAI_MODEL_EMBEDDING || 'text-embedding-3-small',
    modelStt: process.env.OPENAI_MODEL_STT || 'whisper-1',
  },

  rag: {
    chunkSize: parseInt(process.env.RAG_CHUNK_SIZE || '500'),
    chunkOverlap: parseInt(process.env.RAG_CHUNK_OVERLAP || '50'),
    topK: parseInt(process.env.RAG_TOP_K || '5'),
  },

  upload: {
    maxAudioMb: parseInt(process.env.UPLOAD_MAX_AUDIO_MB || '25'),
    maxMaterialMb: parseInt(process.env.UPLOAD_MAX_MATERIAL_MB || '20'),
  },

  points: {
    dailyAttendance: parseInt(process.env.POINT_DAILY_ATTENDANCE || '10'),
    correctA: parseInt(process.env.POINT_CORRECT_A || '5'),
    correctB: parseInt(process.env.POINT_CORRECT_B || '10'),
    correctC: parseInt(process.env.POINT_CORRECT_C || '20'),
    qaPerUse: parseInt(process.env.POINT_QA_PER_USE || '2'),
    streak7: parseInt(process.env.POINT_STREAK_7 || '30'),
    streak30: parseInt(process.env.POINT_STREAK_30 || '100'),
    weeklyGoal: parseInt(process.env.POINT_WEEKLY_GOAL || '50'),
    toCoupon: parseInt(process.env.POINT_TO_COUPON || '100'),
  },

  churn: {
    riskDays: parseInt(process.env.CHURN_RISK_DAYS || '3'),
    inactiveDays: parseInt(process.env.CHURN_INACTIVE_DAYS || '7'),
  },

  cron: {
    roadmapUpdate: process.env.CRON_ROADMAP_UPDATE || '0 2 * * 1',
    churnDetection: process.env.CRON_CHURN_DETECTION || '0 9 * * *',
  },

  solapi: {
    apiKey: process.env.SOLAPI_API_KEY || '',
    apiSecret: process.env.SOLAPI_API_SECRET || '',
    sender: process.env.SOLAPI_SENDER || '',
  },

  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',

  superAdmin: {
    // 프로덕션에서는 required()가 throw하므로 기본값이 사용되지 않는다.
    email: required('SUPER_ADMIN_EMAIL', 'admin@claiq.kr'),
    password: required('SUPER_ADMIN_PASSWORD', 'admin1234'),
  },
}
