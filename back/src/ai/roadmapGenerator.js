import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { openai } from '../config/openai.js'
import { env } from '../config/env.js'
import { logger } from '../utils/logger.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

const systemPrompt = readFileSync(
  join(__dirname, '../prompts/roadmap/system.txt'),
  'utf-8'
)

/**
 * 수능 D-day 기반 개인 학습 로드맵 생성
 * @param {object} params
 * @param {object[]} params.weakTypes - [{type_code, type_name, correct_rate, frequency_weight}]
 * @param {number} params.ddayCount - 수능까지 남은 일수
 * @param {string} params.studentName
 * @returns {Promise<{summary: string, items: object[]}>}
 */
export const generateRoadmap = async ({ weakTypes, ddayCount, studentName }) => {
  const weekCount = Math.max(1, Math.floor(ddayCount / 7))
  const topWeak = weakTypes.slice(0, 15)

  const typeList = topWeak
    .map((t, i) => `${i + 1}. ${t.type_code} (${t.type_name}): 정답률 ${Math.round((t.correct_rate || 0) * 100)}%, 출제빈도 ${t.frequency_weight}`)
    .join('\n')

  const userPrompt = `수강생 ${studentName}의 개인 맞춤 학습 로드맵을 생성하세요.

수능까지 남은 기간: ${ddayCount}일 (${weekCount}주)
취약 유형 목록 (정답률 낮은 순):
${typeList}

반환 형식 (JSON):
{
  "summary": "전체 로드맵 요약 텍스트 (200자 이내)",
  "weeks": [
    {
      "week_number": 1,
      "items": [
        {
          "type_code": "KOR_READ_FACT",
          "type_name": "사실적 이해",
          "priority_rank": 1,
          "note": "학습 방향 및 핵심 포인트"
        }
      ]
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
      temperature: 0.6,
    })

    const parsed = JSON.parse(response.choices[0].message.content)
    const items = []

    for (const week of parsed.weeks || []) {
      for (const item of week.items || []) {
        items.push({
          week_number: week.week_number,
          type_code: item.type_code,
          type_name: item.type_name,
          priority_rank: item.priority_rank,
          note: item.note,
        })
      }
    }

    logger.info(`로드맵 생성 완료: ${weekCount}주, ${items.length}개 항목`)
    return { summary: parsed.summary || '', items }
  } catch (err) {
    logger.error('로드맵 생성 오류:', err.message)
    throw err
  }
}
