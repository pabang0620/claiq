import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { openai } from '../config/openai.js'
import { env } from '../config/env.js'
import { embedText } from './embedding.js'
import { searchSimilarChunks } from '../domains/lecture/vectorRepository.js'
import { logger } from '../utils/logger.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

const systemPrompt = readFileSync(
  join(__dirname, '../prompts/ragQA/system.txt'),
  'utf-8'
)

/**
 * RAG 기반 Q&A - SSE 스트리밍
 * @param {object} params
 * @param {string} params.question - 학생 질문
 * @param {string} params.teacherId - 교강사 ID (검색 필터)
 * @param {string} params.academyId - 학원 ID (검색 필터)
 * @param {object[]} params.history - 이전 대화 기록 [{role, content}]
 * @param {object} params.res - Express response (SSE)
 * @returns {Promise<{answer: string, sourceChunkIds: string[], isEscalated: boolean}>}
 */
export const streamQA = async ({ question, teacherId, academyId, history = [], res }) => {
  // 클라이언트 disconnect 감지
  let aborted = false
  const controller = new AbortController()

  res.on('close', () => {
    aborted = true
    controller.abort()
  })

  // 1. 질문 임베딩
  const questionEmbedding = await embedText(question)

  // 2. pgvector 유사도 검색
  const chunks = await searchSimilarChunks({
    embedding: questionEmbedding,
    teacherId,
    academyId,
    topK: env.rag.topK,
  })

  const sourceChunkIds = chunks.map((c) => c.id)
  const hasRelevantChunks = chunks.length > 0

  // 3. 컨텍스트 구성
  const context = hasRelevantChunks
    ? chunks.map((c, i) => `[강의 내용 ${i + 1}]\n${c.content}`).join('\n\n')
    : ''

  const messages = [
    {
      role: 'system',
      content: hasRelevantChunks
        ? `${systemPrompt}\n\n참고 강의 내용:\n${context}`
        : `${systemPrompt}\n\n주의: 관련 강의 내용을 찾을 수 없습니다. 강의 범위를 벗어난 질문일 수 있습니다.`,
    },
    ...history.slice(-10).map((m) => ({ role: m.role === 'ai' ? 'assistant' : m.role, content: m.content })),
    { role: 'user', content: question },
  ]

  // 4. GPT 스트리밍
  let fullAnswer = ''
  let isEscalated = false

  try {
    const stream = await openai.chat.completions.create(
      {
        model: env.openai.modelChat,
        messages,
        stream: true,
        temperature: 0.5,
      },
      { signal: controller.signal }
    )

    for await (const chunk of stream) {
      if (aborted) break
      const delta = chunk.choices[0]?.delta?.content || ''
      if (delta) {
        fullAnswer += delta
        if (!res.writableEnded) {
          res.write(`data: ${JSON.stringify({ type: 'chunk', content: delta })}\n\n`)
        }
      }
    }

    if (!aborted) {
      // 에스컬레이션 감지: 강의 범위 외 질문
      if (!hasRelevantChunks || fullAnswer.includes('교강사에게 문의') || fullAnswer.includes('강의 범위를 벗어')) {
        isEscalated = true
      }

      if (!res.writableEnded) {
        res.write(`data: ${JSON.stringify({ type: 'done', sourceChunkIds, isEscalated })}\n\n`)
      }
    }
  } catch (err) {
    if (aborted) {
      logger.warn('RAG Q&A 스트리밍 중단: 클라이언트 disconnect')
      return { answer: fullAnswer, sourceChunkIds, isEscalated }
    }
    logger.error('RAG Q&A 스트리밍 오류:', err.message)
    if (!res.writableEnded) {
      res.write(`data: ${JSON.stringify({ type: 'error', message: 'AI 응답 생성 중 오류가 발생했습니다' })}\n\n`)
    }
    throw err
  }

  return { answer: fullAnswer, sourceChunkIds, isEscalated }
}
