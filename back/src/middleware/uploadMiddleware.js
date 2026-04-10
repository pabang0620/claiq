import multer from 'multer'
import { env } from '../config/env.js'

const storage = multer.memoryStorage()

const audioFilter = (req, file, cb) => {
  const allowed = ['audio/mpeg', 'audio/wav', 'audio/mp4', 'audio/m4a', 'audio/webm', 'audio/ogg']
  if (allowed.includes(file.mimetype)) {
    cb(null, true)
  } else {
    const err = new Error('허용되지 않는 오디오 형식입니다')
    err.status = 400
    cb(err, false)
  }
}

const materialFilter = (req, file, cb) => {
  const allowed = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
  if (allowed.includes(file.mimetype)) {
    cb(null, true)
  } else {
    const err = new Error('허용되지 않는 파일 형식입니다 (PDF, JPG, PNG만 가능)')
    err.status = 400
    cb(err, false)
  }
}

export const uploadAudio = multer({
  storage,
  fileFilter: audioFilter,
  limits: { fileSize: env.upload.maxAudioMb * 1024 * 1024 },
})

export const uploadMaterial = multer({
  storage,
  fileFilter: materialFilter,
  limits: { fileSize: env.upload.maxMaterialMb * 1024 * 1024 },
})

// uploadAny는 오디오 + 자료 허용 타입을 합친 필터를 적용한다.
// 파일 타입 검증 없이 사용하지 않는다.
const ALLOWED_ANY = new Set([
  'audio/mpeg', 'audio/wav', 'audio/mp4', 'audio/m4a', 'audio/webm', 'audio/ogg',
  'application/pdf', 'image/jpeg', 'image/png', 'image/webp',
])
const anyFilter = (req, file, cb) => {
  if (ALLOWED_ANY.has(file.mimetype)) {
    cb(null, true)
  } else {
    const err = new Error('허용되지 않는 파일 형식입니다')
    err.status = 400
    cb(err, false)
  }
}

export const uploadAny = multer({
  storage,
  fileFilter: anyFilter,
  limits: { fileSize: Math.max(env.upload.maxAudioMb, env.upload.maxMaterialMb) * 1024 * 1024 },
})
