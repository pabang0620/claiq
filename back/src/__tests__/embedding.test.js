/**
 * embedding.js 단위 테스트
 * OpenAI API를 mock하여 핵심 로직만 검증
 */

import { jest } from '@jest/globals'

// --- mock openai config ---
const mockEmbeddingsCreate = jest.fn()
jest.unstable_mockModule('../config/openai.js', () => ({
  openai: {
    embeddings: {
      create: mockEmbeddingsCreate,
    },
  },
}))

// --- mock env config ---
jest.unstable_mockModule('../config/env.js', () => ({
  env: {
    openai: {
      modelEmbedding: 'text-embedding-3-small',
    },
  },
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

const { embedTexts, embedText } = await import('../ai/embedding.js')

describe('embedding.js', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('embedTexts', () => {
    it('단일 텍스트 배열의 임베딩을 반환한다', async () => {
      const fakeEmbedding = [0.1, 0.2, 0.3]
      mockEmbeddingsCreate.mockResolvedValue({
        data: [{ index: 0, embedding: fakeEmbedding }],
      })

      const result = await embedTexts(['안녕하세요'])

      expect(result).toHaveLength(1)
      expect(result[0]).toEqual(fakeEmbedding)
      expect(mockEmbeddingsCreate).toHaveBeenCalledTimes(1)
      expect(mockEmbeddingsCreate).toHaveBeenCalledWith({
        model: 'text-embedding-3-small',
        input: ['안녕하세요'],
      })
    })

    it('여러 텍스트의 임베딩을 올바른 순서로 반환한다', async () => {
      const emb0 = [1, 0, 0]
      const emb1 = [0, 1, 0]
      mockEmbeddingsCreate.mockResolvedValue({
        data: [
          { index: 1, embedding: emb1 },
          { index: 0, embedding: emb0 },
        ],
      })

      const result = await embedTexts(['텍스트A', '텍스트B'])

      expect(result[0]).toEqual(emb0)
      expect(result[1]).toEqual(emb1)
    })

    it('빈 배열을 입력하면 빈 배열을 반환한다', async () => {
      const result = await embedTexts([])
      expect(result).toEqual([])
      expect(mockEmbeddingsCreate).not.toHaveBeenCalled()
    })

    it('429 에러 발생 시 재시도 후 성공한다', async () => {
      const fakeEmbedding = [0.5, 0.5]
      const rateLimitError = Object.assign(new Error('Rate limit'), { status: 429 })

      mockEmbeddingsCreate
        .mockRejectedValueOnce(rateLimitError)
        .mockResolvedValueOnce({
          data: [{ index: 0, embedding: fakeEmbedding }],
        })

      const result = await embedTexts(['테스트'])
      expect(result[0]).toEqual(fakeEmbedding)
      expect(mockEmbeddingsCreate).toHaveBeenCalledTimes(2)
    }, 10000)

    it('429가 아닌 에러는 즉시 throw한다', async () => {
      const serverError = Object.assign(new Error('Server error'), { status: 500 })
      mockEmbeddingsCreate.mockRejectedValue(serverError)

      await expect(embedTexts(['테스트'])).rejects.toThrow('Server error')
      expect(mockEmbeddingsCreate).toHaveBeenCalledTimes(1)
    })
  })

  describe('embedText', () => {
    it('단일 텍스트의 임베딩 벡터를 반환한다', async () => {
      const fakeEmbedding = [0.1, 0.2, 0.3]
      mockEmbeddingsCreate.mockResolvedValue({
        data: [{ index: 0, embedding: fakeEmbedding }],
      })

      const result = await embedText('단일 텍스트')

      expect(result).toEqual(fakeEmbedding)
    })

    it('embedTexts를 내부적으로 호출하여 첫 번째 요소를 반환한다', async () => {
      const fakeEmbedding = [0.9, 0.8, 0.7]
      mockEmbeddingsCreate.mockResolvedValue({
        data: [{ index: 0, embedding: fakeEmbedding }],
      })

      const result = await embedText('테스트')

      expect(Array.isArray(result)).toBe(true)
      expect(result).toEqual(fakeEmbedding)
    })
  })
})
