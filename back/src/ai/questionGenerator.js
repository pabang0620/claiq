import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { openai } from '../config/openai.js'
import { env } from '../config/env.js'
import { logger } from '../utils/logger.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

const loadPrompt = (area) => {
  const areaMap = { '국어': 'korean', '수학': 'math', '영어': 'english' }
  const filename = areaMap[area] || 'system'
  try {
    return readFileSync(join(__dirname, `../prompts/questionGeneration/${filename}.txt`), 'utf-8')
  } catch {
    return readFileSync(join(__dirname, '../prompts/questionGeneration/system.txt'), 'utf-8')
  }
}

/**
 * 강의 청크로 난이도별 문제 생성
 * @param {string[]} chunks - 강의 청크 텍스트 배열
 * @param {string} area - '국어' | '수학' | '영어'
 * @param {string[]} typeCodes - 수능 유형 코드 배열
 * @param {string} difficulty - 'A' | 'B' | 'C'
 * @param {number} count - 생성할 문제 수 (기본 5)
 * @returns {Promise<object[]>}
 */
export const generateQuestions = async (chunks, area, typeCodes, difficulty, count = 5) => {
  const systemPrompt = loadPrompt(area)
  const context = chunks.slice(0, 5).join('\n\n')

  const difficultyLabel = { A: '하(기본)', B: '중(응용)', C: '상(심화)' }[difficulty]

  const userPrompt = `다음 강의 내용을 바탕으로 수능 형식의 문제를 ${count}개 생성하세요.

난이도: ${difficulty} (${difficultyLabel})
관련 수능 유형: ${typeCodes.join(', ')}

강의 내용:
${context}

반환 형식 (JSON):
{
  "questions": [
    {
      "content": "문제 본문",
      "answer_type": "multiple_choice",
      "options": [
        {"label": "1", "content": "선택지1"},
        {"label": "2", "content": "선택지2"},
        {"label": "3", "content": "선택지3"},
        {"label": "4", "content": "선택지4"},
        {"label": "5", "content": "선택지5"}
      ],
      "correct_answer": "3",
      "explanation": "해설",
      "type_code": "${typeCodes[0] || 'UNKNOWN'}"
    }
  ]
}`

  try {
    const response = await openai.chat.completions.create({
      model: env.openai.modelChat,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
    })

    const parsed = JSON.parse(response.choices[0].message.content)
    const questions = (parsed.questions || []).map((q) => ({
      ...q,
      difficulty,
    }))
    logger.info(`문제 생성 완료: 난이도 ${difficulty} ${questions.length}개`)
    return questions
  } catch (err) {
    logger.error('문제 생성 오류:', err.message)
    return []
  }
}

/**
 * 난이도 A/B/C 각 5개씩 총 15개 생성
 */
export const generateAllQuestions = async (chunks, area, typeCodes) => {
  const [aQuestions, bQuestions, cQuestions] = await Promise.all([
    generateQuestions(chunks, area, typeCodes, 'A', 5),
    generateQuestions(chunks, area, typeCodes, 'B', 5),
    generateQuestions(chunks, area, typeCodes, 'C', 5),
  ])
  return [...aQuestions, ...bQuestions, ...cQuestions]
}
