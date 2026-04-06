import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { openai } from '../config/openai.js'
import { env } from '../config/env.js'
import { logger } from '../utils/logger.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

const systemPrompt = readFileSync(
  join(__dirname, '../prompts/exam/system.txt'),
  'utf-8'
)

/**
 * 개인 맞춤 미니 모의고사 15문항 생성
 * 취약 유형 70% + 기타 30%
 * @param {object[]} weakTypes - [{type_code, type_name, correct_rate}]
 * @param {object[]} allTypes - 전체 유형 목록
 * @param {string} area - '국어' | '수학' | '영어'
 * @param {string[]} availableChunks - 활용 가능한 강의 청크
 * @returns {Promise<object[]>} 15개 문항
 */
export const generateExam = async ({ weakTypes, allTypes, area, availableChunks }) => {
  const TOTAL = 15
  const WEAK_COUNT = Math.round(TOTAL * 0.7) // 11개
  const OTHER_COUNT = TOTAL - WEAK_COUNT     // 4개

  const weakList = weakTypes.slice(0, 8)
  const otherList = allTypes.filter((t) => !weakList.some((w) => w.type_code === t.type_code)).slice(0, 5)

  const context = availableChunks.slice(0, 8).join('\n\n')

  const userPrompt = `수능 형식 미니 모의고사 ${TOTAL}문항을 생성하세요.
과목: ${area}
취약 유형 (${WEAK_COUNT}문항 출제):
${weakList.map((t) => `- ${t.type_code}: ${t.type_name}`).join('\n')}

기타 유형 (${OTHER_COUNT}문항 출제):
${otherList.map((t) => `- ${t.type_code}: ${t.type_name}`).join('\n')}

참고 강의 내용:
${context.slice(0, 3000)}

반환 형식 (JSON):
{
  "questions": [
    {
      "question_order": 1,
      "content": "문제 본문",
      "answer_type": "multiple_choice",
      "options": [{"label": "1", "content": "..."}, ...],
      "correct_answer": "3",
      "type_code": "KOR_READ_FACT",
      "type_name": "사실적 이해",
      "difficulty": "B",
      "score": 5,
      "explanation": "해설"
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
    const questions = (parsed.questions || []).slice(0, TOTAL).map((q, i) => ({
      ...q,
      question_order: i + 1,
    }))

    logger.info(`미니 모의고사 생성 완료: ${questions.length}문항`)
    return questions
  } catch (err) {
    logger.error('모의고사 생성 오류:', err.message)
    throw err
  }
}
