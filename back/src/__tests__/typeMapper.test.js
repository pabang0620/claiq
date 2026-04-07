/**
 * typeMapper.js 단위 테스트
 * 유형 코드 필터링 및 매핑 로직 검증
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

// --- mock fs (readFileSync) ---
const FAKE_SUNEUNG_TYPES = {
  KOR: {
    KOR_READ_FACT: { name: '사실적 이해' },
    KOR_READ_INFER: { name: '추론적 이해' },
    KOR_WRITE_ARG: { name: '논증 분석' },
  },
  MATH: {
    MATH_CALC_BASIC: { name: '기본 계산' },
    MATH_FUNC_LIMIT: { name: '극한과 연속' },
  },
  ENG: {
    ENG_READ_MAIN: { name: '주제 파악' },
    ENG_GRAMMAR_CLAUSE: { name: '절과 구문' },
  },
}

jest.unstable_mockModule('fs', () => ({
  readFileSync: jest.fn((path) => {
    if (path.includes('suneung_types.json')) {
      return JSON.stringify(FAKE_SUNEUNG_TYPES)
    }
    // typeMapping system prompt
    return '당신은 수능 유형 분류 전문가입니다.'
  }),
}))

const { mapTypes } = await import('../ai/typeMapper.js')

describe('typeMapper.js — mapTypes', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('유형 코드 필터링', () => {
    it('유효한 국어 유형 코드만 반환한다', async () => {
      mockChatCreate.mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify({
                types: ['KOR_READ_FACT', 'KOR_READ_INFER', 'INVALID_CODE'],
              }),
            },
          },
        ],
      })

      const result = await mapTypes('국어 강의 transcript 내용...', '국어')

      expect(result).toContain('KOR_READ_FACT')
      expect(result).toContain('KOR_READ_INFER')
      expect(result).not.toContain('INVALID_CODE')
    })

    it('유효한 수학 유형 코드만 반환한다', async () => {
      mockChatCreate.mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify({
                types: ['MATH_CALC_BASIC', 'MATH_FUNC_LIMIT', 'KOR_READ_FACT'],
              }),
            },
          },
        ],
      })

      const result = await mapTypes('수학 강의 transcript 내용...', '수학')

      expect(result).toContain('MATH_CALC_BASIC')
      expect(result).toContain('MATH_FUNC_LIMIT')
      // 수학 영역에서 국어 코드는 필터링
      expect(result).not.toContain('KOR_READ_FACT')
    })

    it('유효한 영어 유형 코드만 반환한다', async () => {
      mockChatCreate.mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify({
                types: ['ENG_READ_MAIN', 'FAKE_CODE'],
              }),
            },
          },
        ],
      })

      const result = await mapTypes('영어 강의 transcript 내용...', '영어')

      expect(result).toContain('ENG_READ_MAIN')
      expect(result).not.toContain('FAKE_CODE')
    })

    it('GPT가 빈 배열을 반환하면 빈 배열을 반환한다', async () => {
      mockChatCreate.mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify({ types: [] }),
            },
          },
        ],
      })

      const result = await mapTypes('짧은 강의 내용', '국어')

      expect(result).toEqual([])
    })

    it('GPT 응답에 types 키가 없으면 빈 배열을 반환한다', async () => {
      mockChatCreate.mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify({}),
            },
          },
        ],
      })

      const result = await mapTypes('강의 내용', '수학')

      expect(result).toEqual([])
    })
  })

  describe('OpenAI 호출 파라미터', () => {
    it('올바른 모델과 json_object 형식으로 호출한다', async () => {
      mockChatCreate.mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify({ types: ['KOR_READ_FACT'] }),
            },
          },
        ],
      })

      await mapTypes('강의 내용', '국어')

      expect(mockChatCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'gpt-4o-mini',
          response_format: { type: 'json_object' },
          temperature: 0.3,
        })
      )
    })

    it('transcript는 앞 2000자만 사용한다', async () => {
      const longTranscript = 'a'.repeat(5000)
      mockChatCreate.mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify({ types: [] }),
            },
          },
        ],
      })

      await mapTypes(longTranscript, '국어')

      const callArgs = mockChatCreate.mock.calls[0][0]
      const userMessage = callArgs.messages[1].content
      // 2000자 이하 substring만 포함되어야 함
      const transcriptInPrompt = userMessage.split('\n').pop()
      expect(transcriptInPrompt.length).toBeLessThanOrEqual(2001)
    })
  })

  describe('에러 처리', () => {
    it('OpenAI 오류 발생 시 빈 배열을 반환한다', async () => {
      mockChatCreate.mockRejectedValue(new Error('API 오류'))

      const result = await mapTypes('강의 내용', '국어')

      expect(result).toEqual([])
    })

    it('JSON 파싱 오류 시 빈 배열을 반환한다', async () => {
      mockChatCreate.mockResolvedValue({
        choices: [
          {
            message: {
              content: 'invalid json {{{',
            },
          },
        ],
      })

      const result = await mapTypes('강의 내용', '국어')

      expect(result).toEqual([])
    })
  })
})
