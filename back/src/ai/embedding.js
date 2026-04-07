import { openai } from '../config/openai.js'
import { env } from '../config/env.js'
import { logger } from '../utils/logger.js'

const BATCH_SIZE = 20
const BATCH_DELAY_MS = 50

/**
 * 429/503 에러 시 exponential backoff 재시도
 * @param {Function} fn - 실행할 비동기 함수
 * @param {number} maxRetries - 최대 재시도 횟수 (기본 3)
 * @returns {Promise<any>}
 */
async function retryWithBackoff(fn, maxRetries = 3) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn()
    } catch (err) {
      if (attempt === maxRetries - 1) throw err
      if (err?.status === 429 || err?.status === 503) {
        const delay = Math.pow(2, attempt) * 1000
        logger.warn(`OpenAI rate limit. Retry ${attempt + 1}/${maxRetries} after ${delay}ms`)
        await new Promise(r => setTimeout(r, delay))
      } else {
        throw err
      }
    }
  }
}

/**
 * 텍스트 배열을 배치로 임베딩
 * @param {string[]} texts
 * @returns {Promise<number[][]>}
 */
export const embedTexts = async (texts) => {
  const embeddings = []

  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, i + BATCH_SIZE)
    try {
      const response = await retryWithBackoff(() =>
        openai.embeddings.create({
          model: env.openai.modelEmbedding,
          input: batch,
        })
      )
      const batchEmbeddings = response.data
        .sort((a, b) => a.index - b.index)
        .map((d) => d.embedding)
      embeddings.push(...batchEmbeddings)
      logger.debug(`임베딩 배치 ${i / BATCH_SIZE + 1} 완료: ${batch.length}개`)

      // 배치 간 rate limit 방지를 위한 delay (마지막 배치 제외)
      if (i + BATCH_SIZE < texts.length) {
        await new Promise(r => setTimeout(r, BATCH_DELAY_MS))
      }
    } catch (err) {
      logger.error('임베딩 오류:', err.message)
      throw err
    }
  }

  return embeddings
}

/**
 * 단일 텍스트 임베딩
 * @param {string} text
 * @returns {Promise<number[]>}
 */
export const embedText = async (text) => {
  const [embedding] = await embedTexts([text])
  return embedding
}
