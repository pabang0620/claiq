import { openai } from '../config/openai.js'
import { env } from '../config/env.js'
import { logger } from '../utils/logger.js'

const BATCH_SIZE = 20

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
      const response = await openai.embeddings.create({
        model: env.openai.modelEmbedding,
        input: batch,
      })
      const batchEmbeddings = response.data
        .sort((a, b) => a.index - b.index)
        .map((d) => d.embedding)
      embeddings.push(...batchEmbeddings)
      logger.debug(`임베딩 배치 ${i / BATCH_SIZE + 1} 완료: ${batch.length}개`)
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
