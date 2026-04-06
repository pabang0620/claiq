import { env } from '../config/env.js'

/**
 * 텍스트를 토큰 단위로 청킹
 * 간단한 공백 기준 토큰 추정 (실제 tiktoken 대신)
 */
const estimateTokens = (text) => Math.ceil(text.length / 4)

export const chunkText = (text, chunkSize = null, overlap = null) => {
  const size = chunkSize || env.rag.chunkSize
  const overlapTokens = overlap || env.rag.chunkOverlap

  const sentences = text
    .replace(/\n+/g, ' ')
    .split(/(?<=[.!?])\s+/)
    .filter((s) => s.trim().length > 0)

  const chunks = []
  let currentChunk = []
  let currentTokens = 0

  for (const sentence of sentences) {
    const sentenceTokens = estimateTokens(sentence)

    if (currentTokens + sentenceTokens > size && currentChunk.length > 0) {
      chunks.push(currentChunk.join(' '))

      // 오버랩: 마지막 몇 문장 유지
      let overlapText = []
      let overlapCount = 0
      for (let i = currentChunk.length - 1; i >= 0; i--) {
        overlapCount += estimateTokens(currentChunk[i])
        if (overlapCount > overlapTokens) break
        overlapText.unshift(currentChunk[i])
      }

      currentChunk = [...overlapText, sentence]
      currentTokens = overlapText.reduce((acc, s) => acc + estimateTokens(s), 0) + sentenceTokens
    } else {
      currentChunk.push(sentence)
      currentTokens += sentenceTokens
    }
  }

  if (currentChunk.length > 0) {
    chunks.push(currentChunk.join(' '))
  }

  return chunks.map((content, index) => ({
    chunk_index: index,
    content,
    token_count: estimateTokens(content),
  }))
}
