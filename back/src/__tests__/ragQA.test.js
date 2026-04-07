/**
 * ragQA.js 단위 테스트
 * 에스컬레이션 판단 로직과 SSE 스트리밍 흐름을 검증
 */

import { jest } from '@jest/globals'

// --- mock OpenAI ---
const mockChatCreate = jest.fn()
jest.unstable_mockModule('../config/openai.js', () => ({
  openai: {
    chat: {
      completions: {
        create: mockChatCreate,
      },
    },
  },
}))

// --- mock env ---
jest.unstable_mockModule('../config/env.js', () => ({
  env: {
    openai: { modelChat: 'gpt-4o-mini' },
    rag: { topK: 5 },
  },
}))

// --- mock embedding ---
const mockEmbedText = jest.fn()
jest.unstable_mockModule('../ai/embedding.js', () => ({
  embedText: mockEmbedText,
}))

// --- mock vectorRepository ---
const mockSearchSimilarChunks = jest.fn()
jest.unstable_mockModule('../domains/lecture/vectorRepository.js', () => ({
  searchSimilarChunks: mockSearchSimilarChunks,
}))

// --- mock logger ---
jest.unstable_mockModule('../utils/logger.js', () => ({
  logger: {
    debug: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
  },
}))

// --- mock fs (prompts/ragQA/system.txt) ---
jest.unstable_mockModule('fs', () => ({
  readFileSync: jest.fn(() => '당신은 학습 도우미입니다.'),
}))

const { streamQA } = await import('../ai/ragQA.js')

/**
 * SSE response mock 생성 헬퍼
 */
function makeMockRes() {
  const events = []
  return {
    write: jest.fn((data) => events.push(data)),
    writableEnded: false,
    on: jest.fn(),
    events,
  }
}

/**
 * async iterator mock 생성 헬퍼
 */
function makeStreamChunks(contents) {
  const chunks = contents.map((content) => ({
    choices: [{ delta: { content } }],
  }))
  return {
    [Symbol.asyncIterator]: async function* () {
      for (const chunk of chunks) {
        yield chunk
      }
    },
  }
}

describe('ragQA.js — streamQA', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockEmbedText.mockResolvedValue([0.1, 0.2, 0.3])
  })

  describe('관련 청크가 있을 때', () => {
    it('청크 내용을 컨텍스트로 활용하고 SSE chunk 이벤트를 전송한다', async () => {
      mockSearchSimilarChunks.mockResolvedValue([
        { id: 'chunk-1', content: '이차방정식 판별식 D = b^2 - 4ac' },
      ])
      mockChatCreate.mockResolvedValue(
        makeStreamChunks(['판별식은 ', 'D = b^2 - 4ac입니다.'])
      )

      const res = makeMockRes()
      const result = await streamQA({
        question: '판별식이 무엇인가요?',
        teacherId: 'teacher-1',
        academyId: 'academy-1',
        history: [],
        res,
      })

      expect(result.answer).toBe('판별식은 D = b^2 - 4ac입니다.')
      expect(result.sourceChunkIds).toEqual(['chunk-1'])
      expect(result.isEscalated).toBe(false)

      const writtenData = res.write.mock.calls.map((c) => c[0])
      const chunkEvents = writtenData.filter((d) => d.includes('"type":"chunk"'))
      expect(chunkEvents.length).toBeGreaterThan(0)
    })

    it('에스컬레이션 키워드가 포함된 답변은 isEscalated = true를 반환한다', async () => {
      mockSearchSimilarChunks.mockResolvedValue([
        { id: 'chunk-2', content: '임시 강의 내용' },
      ])
      mockChatCreate.mockResolvedValue(
        makeStreamChunks(['이 질문은 강의 범위를 벗어난 내용입니다.'])
      )

      const res = makeMockRes()
      const result = await streamQA({
        question: '미적분학의 역사는?',
        teacherId: 'teacher-1',
        academyId: 'academy-1',
        history: [],
        res,
      })

      expect(result.isEscalated).toBe(true)
    })

    it('"교강사에게 문의" 키워드가 포함되면 isEscalated = true이다', async () => {
      mockSearchSimilarChunks.mockResolvedValue([
        { id: 'chunk-3', content: '임시 강의 내용' },
      ])
      mockChatCreate.mockResolvedValue(
        makeStreamChunks(['더 자세한 내용은 교강사에게 문의하세요.'])
      )

      const res = makeMockRes()
      const result = await streamQA({
        question: '어려운 질문',
        teacherId: 'teacher-1',
        academyId: 'academy-1',
        history: [],
        res,
      })

      expect(result.isEscalated).toBe(true)
    })
  })

  describe('관련 청크가 없을 때', () => {
    it('청크가 없으면 isEscalated = true를 반환한다', async () => {
      mockSearchSimilarChunks.mockResolvedValue([])
      mockChatCreate.mockResolvedValue(
        makeStreamChunks(['죄송합니다, 관련 강의 내용을 찾을 수 없습니다.'])
      )

      const res = makeMockRes()
      const result = await streamQA({
        question: '전혀 관계없는 질문',
        teacherId: 'teacher-1',
        academyId: 'academy-1',
        history: [],
        res,
      })

      expect(result.isEscalated).toBe(true)
      expect(result.sourceChunkIds).toEqual([])
    })

    it('시스템 프롬프트에 "관련 강의 내용을 찾을 수 없습니다" 경고가 포함된다', async () => {
      mockSearchSimilarChunks.mockResolvedValue([])
      mockChatCreate.mockResolvedValue(makeStreamChunks(['']))

      const res = makeMockRes()
      await streamQA({
        question: '강의 범위 외 질문',
        teacherId: 'teacher-1',
        academyId: 'academy-1',
        history: [],
        res,
      })

      const callArgs = mockChatCreate.mock.calls[0][0]
      const systemMessage = callArgs.messages[0].content
      expect(systemMessage).toContain('관련 강의 내용을 찾을 수 없습니다')
    })
  })

  describe('대화 히스토리 처리', () => {
    it('history의 role ai를 assistant로 변환하여 전달한다', async () => {
      mockSearchSimilarChunks.mockResolvedValue([
        { id: 'chunk-1', content: '강의 내용' },
      ])
      mockChatCreate.mockResolvedValue(makeStreamChunks(['답변']))

      const res = makeMockRes()
      await streamQA({
        question: '후속 질문',
        teacherId: 'teacher-1',
        academyId: 'academy-1',
        history: [
          { role: 'user', content: '이전 질문' },
          { role: 'ai', content: '이전 답변' },
        ],
        res,
      })

      const callArgs = mockChatCreate.mock.calls[0][0]
      const messages = callArgs.messages
      const assistantMsg = messages.find((m) => m.role === 'assistant')
      expect(assistantMsg).toBeDefined()
      expect(assistantMsg.content).toBe('이전 답변')
    })

    it('히스토리를 최대 10개로 제한한다', async () => {
      mockSearchSimilarChunks.mockResolvedValue([
        { id: 'chunk-1', content: '강의 내용' },
      ])
      mockChatCreate.mockResolvedValue(makeStreamChunks(['답변']))

      const longHistory = Array.from({ length: 20 }, (_, i) => ({
        role: i % 2 === 0 ? 'user' : 'ai',
        content: `메시지 ${i}`,
      }))

      const res = makeMockRes()
      await streamQA({
        question: '새 질문',
        teacherId: 'teacher-1',
        academyId: 'academy-1',
        history: longHistory,
        res,
      })

      const callArgs = mockChatCreate.mock.calls[0][0]
      // system(1) + history(최대10) + user(1) = 최대 12개
      expect(callArgs.messages.length).toBeLessThanOrEqual(12)
    })
  })

  describe('에러 처리', () => {
    it('OpenAI 오류 시 SSE error 이벤트를 전송하고 throw한다', async () => {
      mockSearchSimilarChunks.mockResolvedValue([
        { id: 'chunk-1', content: '강의 내용' },
      ])
      mockChatCreate.mockRejectedValue(new Error('OpenAI 서버 오류'))

      const res = makeMockRes()
      await expect(
        streamQA({
          question: '질문',
          teacherId: 'teacher-1',
          academyId: 'academy-1',
          history: [],
          res,
        })
      ).rejects.toThrow('OpenAI 서버 오류')

      const writtenData = res.write.mock.calls.map((c) => c[0])
      const errorEvent = writtenData.find((d) => d.includes('"type":"error"'))
      expect(errorEvent).toBeDefined()
    })
  })
})
