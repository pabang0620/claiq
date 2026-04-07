// logger.js 는 env.js 보다 먼저 로드될 수 있으므로 (env.js 초기화 실패 로깅 포함)
// 순환 참조 방지를 위해 process.env.NODE_ENV 를 직접 사용한다.
const timestamp = () => new Date().toISOString()

export const logger = {
  info: (...args) => console.log(`[${timestamp()}] [INFO]`, ...args),
  warn: (...args) => console.warn(`[${timestamp()}] [WARN]`, ...args),
  error: (...args) => console.error(`[${timestamp()}] [ERROR]`, ...args),
  debug: (...args) => {
    if (process.env.NODE_ENV !== 'production') {
      console.debug(`[${timestamp()}] [DEBUG]`, ...args)
    }
  },
}
