import { createReadStream } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { writeFileSync, unlinkSync } from 'fs'
import { openai } from '../config/openai.js'
import { env } from '../config/env.js'
import { logger } from '../utils/logger.js'

/**
 * 버퍼를 Whisper API로 STT 변환
 * @param {Buffer} audioBuffer - 오디오 파일 버퍼
 * @param {string} mimetype - 파일 MIME 타입
 * @param {string} originalName - 원본 파일명
 * @returns {Promise<string>} 변환된 텍스트
 */
export const transcribeAudio = async (audioBuffer, mimetype, originalName) => {
  const ext = originalName.split('.').pop() || 'mp3'
  const tmpPath = join(tmpdir(), `claiq_audio_${Date.now()}.${ext}`)

  try {
    writeFileSync(tmpPath, audioBuffer)

    const response = await openai.audio.transcriptions.create({
      file: createReadStream(tmpPath),
      model: env.openai.modelStt,
      language: 'ko',
      response_format: 'text',
    })

    logger.info(`Whisper STT 완료: ${originalName} → ${response.length}자`)
    return response
  } catch (err) {
    logger.error('Whisper STT 오류:', err.message)
    throw err
  } finally {
    try { unlinkSync(tmpPath) } catch {}
  }
}
