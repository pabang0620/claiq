import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { openai } from '../config/openai.js'
import { env } from '../config/env.js'
import { logger } from '../utils/logger.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

const systemPrompt = readFileSync(
  join(__dirname, '../prompts/typeMapping/system.txt'),
  'utf-8'
)

let suneungTypes = null
const loadSuneungTypes = () => {
  if (!suneungTypes) {
    suneungTypes = JSON.parse(
      readFileSync(join(__dirname, '../data/suneung_types.json'), 'utf-8')
    )
  }
  return suneungTypes
}

/**
 * 강의 transcript를 분석하여 수능 유형 코드 배열 반환
 * @param {string} transcript
 * @param {string} area - '국어' | '수학' | '영어'
 * @returns {Promise<string[]>} 유형 코드 배열
 */
export const mapTypes = async (transcript, area) => {
  const types = loadSuneungTypes()
  const areaKey = area === '국어' ? 'KOR' : area === '수학' ? 'MATH' : 'ENG'
  const typeList = Object.entries(types[areaKey] || {})
    .map(([code, info]) => `${code}: ${info.name}`)
    .join('\n')

  const userPrompt = `다음 강의 내용을 분석하여 해당되는 수능 유형 코드를 JSON 배열로 반환하세요.

사용 가능한 유형 코드:
${typeList}

강의 내용 (앞 2000자):
${transcript.slice(0, 2000)}

반환 형식: {"types": ["코드1", "코드2", ...]}`

  try {
    const response = await openai.chat.completions.create({
      model: env.openai.modelChat,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    })

    const parsed = JSON.parse(response.choices[0].message.content)
    const validCodes = Object.keys(types[areaKey] || {})
    const filteredTypes = (parsed.types || []).filter((code) => validCodes.includes(code))
    logger.info(`유형 매핑 완료: ${filteredTypes.join(', ')}`)
    return filteredTypes
  } catch (err) {
    logger.error('유형 매핑 오류:', err.message)
    return []
  }
}
